"use strict";

var jwt = require("jsonwebtoken");

var sendToken = function sendToken(user, statusCode, res, role) {
  var token = user.getJWTToken(); // options for cookie

  var options = {
    expiresIn: new Date(Date.now() + process.env.JWT_EXPIRE * 30 * 24 * 60 * 60 * 1000),
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