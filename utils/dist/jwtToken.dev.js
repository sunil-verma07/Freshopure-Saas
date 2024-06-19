"use strict";

var jwt = require("jsonwebtoken"); // const sendToken = (user, statusCode, res, role) => {
//   const token = user.getJWTToken();
//   // options for cookie
//   const options = {
//     expiresIn: new Date(
//       Date.now() + process.env.JWT_EXPIRE * 30 * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//   };
//   res.status(statusCode).cookie("token", token, options).json({
//     success: true,
//     user,
//     token,
//     role,
//   });
// };


var sendToken = function sendToken(user, statusCode, res, role) {
  // Define the expiration period in days (1 day)
  var expireTimeMilliseconds = process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000; // Convert days to milliseconds for cookie

  var expireTimeSeconds = process.env.JWT_EXPIRE * 24 * 60 * 60; // Convert days to seconds for JWT token
  // Create the token with expiration time

  var token = jwt.sign({
    id: user._id
  }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  }); // Set cookie options

  var options = {
    expiresIn: "30d",
    httpOnly: true
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: user,
    token: token,
    role: role
  });
};

var generatePaymentToken = function generatePaymentToken(_ref) {
  var userId = _ref.userId,
      planDuration = _ref.planDuration,
      date = _ref.date;
  // Define payload with user ID and plan duration
  var payload = {
    userId: userId,
    planDuration: planDuration
  };
  var expiration = Math.floor(Date.now() / 1000) + planDuration * 24 * 60 * 60;
  console.log(planDuration, expiration, "exp"); // Sign JWT token with payload, secret key, and expiration time

  var token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiration
  });
  return token;
};

module.exports = {
  sendToken: sendToken,
  generatePaymentToken: generatePaymentToken
};