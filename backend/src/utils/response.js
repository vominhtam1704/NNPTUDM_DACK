const formatSuccess = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

const formatError = (message, statusCode = 400, errors = null) => {
  return {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  };
};

const formatPaginated = (data, page, limit, total) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  formatSuccess,
  formatError,
  formatPaginated
};
