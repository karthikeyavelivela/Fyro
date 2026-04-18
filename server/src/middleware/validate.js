const { validationResult } = require("express-validator");
const { fail } = require("../utils/response");

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, "Validation failed", 422, { errors: errors.array() });
  }
  next();
};
