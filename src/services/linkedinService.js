const axios = require('axios');
const cheerio = require('cheerio');

class LinkedInService {
  constructor() {
    this.baseUrl =
      'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';
    this.userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  buildSearchUrl(params) {
    const url = new URL(this.baseUrl);

    // Add search parameters
    if (params.keywords) {
      url.searchParams.set('keywords', params.keywords);
    }

    if (params.location) {
      url.searchParams.set('location', params.location);
    }

    // Experience level filter
    if (params.experienceLevel) {
      url.searchParams.set('f_E', params.experienceLevel);
    }

    // Job type filter
    if (params.jobType) {
      url.searchParams.set('f_JT', params.jobType);
    }

    // Work schedule filter
    if (params.workSchedule) {
      url.searchParams.set('f_WT', params.workSchedule);
    }

    // Posted within filter
    if (params.postedWithin) {
      url.searchParams.set('f_TPR', params.postedWithin);
    }

    // Pagination
    if (params.start) {
      url.searchParams.set('start', params.start.toString());
    }

    // Simplified application filter
    if (params.simplifiedApplication) {
      url.searchParams.set('f_AL', 'true');
    }

    // Less than 10 applicants filter
    if (params.lessThan10Applicants) {
      url.searchParams.set('f_JIYN', 'true');
    }

    return url.toString();
  }

  async searchJobs(params) {
    try {
      const searchUrl = this.buildSearchUrl(params);

      console.log('Searching LinkedIn jobs with URL:', searchUrl);

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      });

      if (response.status !== 200) {
        throw new Error(`LinkedIn API returned status ${response.status}`);
      }

      const jobs = this.parseJobListings(response.data);
      return jobs;
    } catch (error) {
      console.error('Error searching LinkedIn jobs:', error);
      throw new Error(`Failed to search LinkedIn jobs: ${error.message}`);
    }
  }

  parseJobListings(html) {
    try {
      const $ = cheerio.load(html);
      const jobs = [];

      // Parse each job listing
      $('li > div.base-card').each((index, element) => {
        try {
          const jobElement = $(element);

          // Extract job title
          const titleElement = jobElement.find('[class*="_title"]');
          const title = titleElement.text().trim();

          // Extract job URL
          const linkElement = jobElement.find('[class*="_full-link"]');
          const jobUrl = linkElement.attr('href');

          // Extract company name
          const companyElement = jobElement.find('[class*="_subtitle"]');
          const company = companyElement.text().trim();

          // Extract location
          const locationElement = jobElement.find('[class*="_location"]');
          const location = locationElement.text().trim();

          // Extract post time
          const timeElement = jobElement.find('[class*="listdate"]');
          const postTime = timeElement.text().trim();

          // Extract job ID from URL if available
          let jobId = null;
          if (jobUrl) {
            const urlParts = jobUrl.split('?')[0].split('-');
            jobId = urlParts[urlParts.length - 1];
          }

          if (title && jobUrl) {
            jobs.push({
              id: jobId,
              title: title,
              company: company || 'Unknown Company',
              location: location || 'Location not specified',
              postTime: postTime || 'Time not specified',
              jobUrl: jobUrl,
              applicationUrl: jobUrl, // LinkedIn job URLs typically lead to application page
            });
          }
        } catch (parseError) {
          console.warn('Error parsing individual job listing:', parseError);
          // Continue parsing other jobs even if one fails
        }
      });

      return jobs;
    } catch (error) {
      console.error('Error parsing job listings HTML:', error);
      throw new Error(`Failed to parse job listings: ${error.message}`);
    }
  }

  async getJobDetails(jobId) {
    try {
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        timeout: 10000,
      });

      if (response.status !== 200) {
        throw new Error(
          `LinkedIn Job Details API returned status ${response.status}`
        );
      }

      return this.parseJobDetails(response.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw new Error(`Failed to fetch job details: ${error.message}`);
    }
  }

  parseJobDetails(html) {
    try {
      const $ = cheerio.load(html);

      const jobDetails = {
        title: $('.job-details-jobs-unified-top-card__job-title').text().trim(),
        company: $('.job-details-jobs-unified-top-card__company-name')
          .text()
          .trim(),
        location: $('.job-details-jobs-unified-top-card__bullet')
          .first()
          .text()
          .trim(),
        description: $('.job-details-jobs-unified-top-card__job-description')
          .text()
          .trim(),
        requirements: $('.job-details-jobs-unified-top-card__job-criteria-item')
          .map((i, el) => $(el).text().trim())
          .get(),
        benefits: $('.job-details-jobs-unified-top-card__benefits')
          .text()
          .trim(),
        applicationUrl: $(
          '.job-details-jobs-unified-top-card__apply-button'
        ).attr('href'),
      };

      return jobDetails;
    } catch (error) {
      console.error('Error parsing job details HTML:', error);
      throw new Error(`Failed to parse job details: ${error.message}`);
    }
  }
}

module.exports = LinkedInService;
