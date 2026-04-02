const { createErrorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    createErrorResponse(statusCode, message, err.errors)
  );
};

module.exports = errorHandler;
