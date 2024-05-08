const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res, role) => {
  const token = user.getJWTToken();
  // options for cookie
  const options = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
    role,
  });
};

const generatePaymentToken = ({ userId, planDuration, date }) => {
  // Define payload with user ID and plan duration
  const payload = {
    userId: userId,
    planDuration: planDuration,
  };

  const expiration =
    Math.floor(Date.now() / 1000) + planDuration * 24 * 60 * 60;

  console.log(planDuration, expiration, "exp");
  // Sign JWT token with payload, secret key, and expiration time
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiration,
  });

  return token;
};

module.exports = { sendToken, generatePaymentToken };
