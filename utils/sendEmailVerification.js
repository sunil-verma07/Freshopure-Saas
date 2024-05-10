const msg91 = require("msg91").default;

msg91.initialize({ authKey: process.env.AUTH_KEY_MSG91 });

async function sendOtp(phone) {
  try {
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });

    const res = await otp.send("91" + phone);
    console.log(res, "response");
    return res;
  } catch (error) {
    return error;
  }
}

async function verifyOtp(phone, code) {
  try {
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });
    const res = await otp.verify("91" + phone, code);
    console.log(res, "res");
    return res;
  } catch (error) {
    return error;
  }
}

async function resendOtp(phone) {
  try {
    const res = await otp.retry("91" + phone);
    return res;
  } catch (error) {
    return error;
  }
}

module.exports = { sendOtp, verifyOtp, resendOtp };
