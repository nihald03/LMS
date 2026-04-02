const createErrorResponse = (statusCode, message, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    ...(errors && { errors }),
  };
};

const createSuccessResponse = (statusCode, message, data = null) => {
  return {
    success: true,
    statusCode,
    message,
    ...(data && { data }),
  };
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
};
