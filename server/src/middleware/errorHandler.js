const { fail } = require("../utils/response");

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (res.headersSent) {
    return next(error);
  }

  return fail(res, message, statusCode, {
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}

module.exports = errorHandler;
