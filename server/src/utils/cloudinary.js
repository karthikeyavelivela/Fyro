const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

cloudinary.config(env.cloudinary);

module.exports = cloudinary;
