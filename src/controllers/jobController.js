const LinkedInService = require('../services/linkedinService');
const Resume = require('../models/Resume');
const { getGeminiSkillClusters } = require('../services/geminiService');

class JobController {
  constructor() {
    this.linkedinService = new LinkedInService();
    this.searchJobs = this.searchJobs.bind(this);
    this.getJobDetails = this.getJobDetails.bind(this);
    this.getJobRecommendations = this.getJobRecommendations.bind(this);
  }

  async searchJobs(req, res) {
    try {
      const userId = req.user.id;
      const {
        resumeId,
        keywords,
        location,
        experienceLevel,
        jobType,
        workSchedule,
        postedWithin,
        start = 0,
        simplifiedApplication,
        lessThan10Applicants,
      } = req.query;

      let searchParams = {
        keywords,
        location,
        experienceLevel,
        jobType,
        workSchedule,
        postedWithin,
        start: parseInt(start),
        simplifiedApplication: simplifiedApplication === 'true',
        lessThan10Applicants: lessThan10Applicants === 'true',
      };

      // If resumeId is provided, fetch resume data and use it to populate search parameters
      if (resumeId) {
        const resume = await Resume.findOne({
          _id: resumeId,
          userId,
        }).select('extractedData');

        if (!resume) {
          return res.status(404).json({
            success: false,
            message: 'Resume not found',
          });
        }

        const extractedData = resume.extractedData;

        // Use resume data to populate search parameters if not already provided
        if (
          !searchParams.keywords &&
          extractedData.skills &&
          Array.isArray(extractedData.skills)
        ) {
          searchParams.keywords = extractedData.skills.slice(0, 5).join(', '); // Use top 5 skills
        }

        if (!searchParams.location && extractedData.location) {
          searchParams.location = extractedData.location;
        }
      }

      // Validate that we have at least keywords or location
      if (!searchParams.keywords && !searchParams.location) {
        return res.status(400).json({
          success: false,
          message:
            'Either keywords or location must be provided, or a resumeId with extracted data',
        });
      }

      // Search for jobs using LinkedIn service
      const jobs = await this.linkedinService.searchJobs(searchParams);

      res.status(200).json({
        success: true,
        message: 'Jobs fetched successfully',
        data: {
          jobs,
          searchParams,
          totalResults: jobs.length,
        },
      });
    } catch (error) {
      console.error('Job search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search jobs',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async getJobDetails(req, res) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID is required',
        });
      }

      const jobDetails = await this.linkedinService.getJobDetails(jobId);

      res.status(200).json({
        success: true,
        data: jobDetails,
      });
    } catch (error) {
      console.error('Get job details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch job details',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async getJobRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const { resumeId } = req.params;

      // Get resume data (same as before)
      let resume;
      if (resumeId) {
        resume = await Resume.findOne({ _id: resumeId, userId }).select(
          'extractedData'
        );
      } else {
        resume = await Resume.findOne({ userId })
          .select('extractedData')
          .sort({ uploadedAt: -1 });
      }
      if (!resume || !resume.extractedData) {
        return res.status(404).json({
          success: false,
          message: 'No resume with extracted data found',
        });
      }

      const {
        skills = [],
        location,
        locationCity,
        locationCountry,
      } = resume.extractedData;
      if (skills.length === 0) {
        return res
          .status(200)
          .json({ success: true, data: { jobs: [], totalRecommendations: 0 } });
      }

      // Get skill clusters from Gemini
      const geminiApiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
      const clusters = await getGeminiSkillClusters(skills, geminiApiKey);
      console.log(clusters);

      if (!clusters || clusters.length === 0) {
        return res
          .status(200)
          .json({ success: true, data: { jobs: [], totalRecommendations: 0 } });
      }

      // Fetch jobs with pagination for each cluster
      const linkedInService = new LinkedInService();
      const allJobs = [];
      const seenJobUrls = new Set();

      // How many pages to fetch per context per cluster (1 = 10 jobs)
      const pagesPerContext = 1;
      const jobsPerCluster = pagesPerContext * 10 * 3; // 3 contexts

      for (const cluster of clusters) {
        const safeCluster = cluster.slice(0, 5);
        const keywords = safeCluster.join(' ');

        // THREE CONTEXTS
        const contexts = [];
        if (locationCity) {
          contexts.push({ type: 'local', location: location });
        }
        contexts.push({ type: 'national', location: locationCountry });
        contexts.push({
          type: 'remote',
          location: '',
        });

        for (const context of contexts) {
          for (let page = 0; page < pagesPerContext; page++) {
            const start = page * 10;

            try {
              const jobs = await linkedInService.searchJobs({
                keywords,
                location: context.location,
                start,
                workSchedule: context.type === 'remote' ? 1 : '',
              });

              for (const job of jobs) {
                if (!seenJobUrls.has(job.jobUrl)) {
                  seenJobUrls.add(job.jobUrl);
                  const existing = allJobs.find((j) => j.jobUrl === job.jobUrl);
                  if (existing) {
                    existing.matchedClusters.push(keywords);
                    existing.matchCount = existing.matchedClusters.length;
                  } else {
                    allJobs.push({
                      ...job,
                      matchedClusters: [keywords],
                      matchCount: 1,
                      clusterSource: keywords,
                      context: context.type, // 'local', 'national', 'remote'
                    });
                  }
                }
              }

              if (jobs.length < 10) break; // No more pages for this context
            } catch (error) {
              console.warn(
                `Failed to fetch jobs for cluster [${safeCluster}] context [${context.type}]:`,
                error
              );
              continue;
            }
          }
        }
      }

      // Rank by relevance (jobs matching multiple clusters ranked higher)
      allJobs.sort((a, b) => b.matchCount - a.matchCount);

      // Final pagination for response
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const paginatedJobs = allJobs.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        data: {
          jobs: paginatedJobs,
          totalRecommendations: allJobs.length,
          basedOnResume: resumeId || 'Most recent resume',
          clustersUsed: clusters.length,
          avgJobsPerCluster: Math.round(allJobs.length / clusters.length),
        },
      });
    } catch (error) {
      console.error('Get job recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate job recommendations',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new JobController();
