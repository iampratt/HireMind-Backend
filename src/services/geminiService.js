const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async getSkillClusters(skills) {
    try {
      if (!skills || skills.length === 0) {
        return [];
      }

      // Create a focused prompt for skill clustering
      const prompt = `
You are an expert in the Indian tech job market. Given the following programming/technical skills, group them into 3-5 keyword clusters that would be optimal for LinkedIn job search queries in India.

Skills: ${skills.join(', ')}

Requirements:
1. Each cluster should represent a likely job role or skill combination in the Indian market
2. Maximum 5 skills per cluster 
3. Skills can appear in multiple clusters if they're commonly used together
4. Focus on combinations that Indian employers typically look for
5. Return ONLY a valid JSON array of arrays, no other text

Example format: [["JavaScript","React.js","Node.js"], ["Python","Django","SQL"], ["Java","Spring","MySQL"]]

Skills to cluster: ${skills.join(', ')}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Parse the JSON response
      let clusters;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          clusters = JSON.parse(jsonMatch[0]);
        } else {
          clusters = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid JSON response from Gemini');
      }

      // Validate and sanitize clusters
      const validClusters = this.validateClusters(clusters, skills);

      console.log(
        `Generated ${validClusters.length} skill clusters for user skills`
      );
      return validClusters;
    } catch (error) {
      console.error('Gemini skill clustering error:', error);
      throw new Error(`Failed to generate skill clusters: ${error.message}`);
    }
  }

  validateClusters(clusters, originalSkills) {
    if (!Array.isArray(clusters)) {
      throw new Error('Clusters must be an array');
    }

    const validClusters = [];

    for (const cluster of clusters) {
      if (!Array.isArray(cluster)) {
        console.warn('Skipping invalid cluster (not an array):', cluster);
        continue;
      }

      // Filter cluster to only include skills the user actually has
      const validSkills = cluster.filter((skill) =>
        originalSkills.some(
          (userSkill) =>
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      // Only keep clusters with at least 1 valid skill
      if (validSkills.length > 0) {
        // Limit to max 5 skills per cluster for API efficiency
        validClusters.push(validSkills.slice(0, 5));
      }
    }

    // Ensure we have at least 1 cluster
    if (validClusters.length === 0) {
      // Fallback: create a cluster with top 3-5 user skills
      validClusters.push(
        originalSkills.slice(0, Math.min(5, originalSkills.length))
      );
    }

    return validClusters;
  }
}

// Simple function export for easy usage
async function getGeminiSkillClusters(skills, apiKey) {
  const geminiService = new GeminiService(apiKey);
  return await geminiService.getSkillClusters(skills);
}

module.exports = {
  GeminiService,
  getGeminiSkillClusters,
};
