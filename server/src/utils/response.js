function sendResponse(res, statusCode, success, data, message) {
  return res.status(statusCode).json({
    success,
    data,
    message,
  });
}

module.exports = {
  ok: (res, data = {}, message = "OK", statusCode = 200) => sendResponse(res, statusCode, true, data, message),
  fail: (res, message = "Something went wrong", statusCode = 400, data = {}) =>
    sendResponse(res, statusCode, false, data, message),
};
