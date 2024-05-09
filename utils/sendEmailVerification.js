const msg91 = require("msg91").default;

msg91.initialize({ authKey: process.env.AUTH_KEY_MSG91 });

async function sendOtp(phone) {
  try {
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });

    const res = await otp.send('91'+phone);
    console.log(res,'response')
    return 1;
  } catch (error) {
    return 0;
  }
}

async function verifyOtp(phone, code) {
  try {
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });
    const res = await otp.verify(phone, code);
    return 1;
  } catch (error) {
    return error;
  }
}

async function resendOtp(phone) {
  try {
    const res = await otp.retry(phone);
    return 1;
  } catch (error) {
    return 0;
  }
}

module.exports = { sendOtp, verifyOtp, resendOtp };
