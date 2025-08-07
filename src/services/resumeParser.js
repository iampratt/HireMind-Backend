const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { DocxLoader } = require('langchain/document_loaders/fs/docx');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const fs = require('fs');
const path = require('path');

class ResumeParser {
  constructor(geminiApiKey) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async loadDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    try {
      let loader;

      switch (ext) {
        case '.pdf':
          loader = new PDFLoader(filePath);
          break;
        case '.docx':
          loader = new DocxLoader(filePath);
          break;
        case '.txt':
          loader = new TextLoader(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      const docs = await loader.load();
      return docs[0].pageContent;
    } catch (error) {
      console.error('Error loading document:', error);
      throw new Error(`Failed to load document: ${error.message}`);
    }
  }

  async extractResumeData(resumeText) {
    const prompt = `
You are an expert resume parser. Extract the following information from the resume text below and return it as a valid JSON object.

Required fields:
- name: Full name of the person
- email: Email address
- phone: Phone number (if available)
- location: Current location (city, state, country)
- locationCity: Current City (if available)
- locationCountry: Current Country (if not available, then guess it from resume data)
- skills: Array of technical skills and competencies
- experience: Array of work experience objects with title, company, duration, and description
- education: Array of education objects with degree, institution, and years
- summary: Professional summary or objective (if available)

Guidelines:
- If a field is not found, use null for strings or empty array for arrays
- For experience, extract job title, company name, duration, and a brief description
- For skills, focus on technical skills, programming languages, tools, and technologies
- For location, try to extract the most recent or current location
- Ensure the output is valid JSON that can be parsed

Resume text:
${resumeText}

Return only the JSON object, no additional text or formatting.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      // Validate and clean the extracted data
      return this.validateAndCleanData(extractedData);
    } catch (error) {
      console.error('Error extracting resume data:', error);
      throw new Error(`Failed to extract resume data: ${error.message}`);
    }
  }

  validateAndCleanData(data) {
    const cleaned = {
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      locationCity: data.locationCity || null,
      locationCountry: data.locationCountry || null,
      skills: Array.isArray(data.skills)
        ? data.skills.filter((skill) => skill && skill.trim())
        : [],
      experience: Array.isArray(data.experience)
        ? data.experience.map((exp) => ({
            title: exp.title || null,
            company: exp.company || null,
            duration: exp.duration || null,
            description: exp.description || null,
          }))
        : [],
      education: Array.isArray(data.education)
        ? data.education.map((edu) => ({
            degree: edu.degree || null,
            institution: edu.institution || null,
            years: edu.years || null,
          }))
        : [],
      summary: data.summary || null,
    };

    return cleaned;
  }

  async parseResume(filePath) {
    try {
      // Load the document
      const resumeText = await this.loadDocument(filePath);
      console.log(resumeText);
      // Extract structured data using Gemini
      const extractedData = await this.extractResumeData(resumeText);

      return extractedData;
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw error;
    }
  }
}

module.exports = ResumeParser;
