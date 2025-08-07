const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.details;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.message && err.message.includes('not found')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message && err.message.includes('already exists')) {
    statusCode = 400;
    message = err.message;
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  // Development error details
  if (process.env.NODE_ENV === 'development') {
    details = {
      message: err.message,
      stack: err.stack,
      name: err.name,
    };
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
};

module.exports = errorHandler;
