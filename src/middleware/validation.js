const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

// Validation schemas
const authSchemas = {
  signup: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    geminiApiKey: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const jobSearchSchema = Joi.object({
  resumeId: Joi.string().optional(),
  keywords: Joi.string().optional(),
  location: Joi.string().optional(),
  experienceLevel: Joi.string().optional(),
  jobType: Joi.string().optional(),
  workSchedule: Joi.string().optional(),
  postedWithin: Joi.string().optional(),
  start: Joi.number().integer().min(0).optional(),
  simplifiedApplication: Joi.boolean().optional(),
  lessThan10Applicants: Joi.boolean().optional(),
});

module.exports = {
  validateRequest,
  authSchemas,
  jobSearchSchema,
};
