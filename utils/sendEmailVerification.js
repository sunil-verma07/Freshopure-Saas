const msg91 = require("msg91").default;

msg91.initialize({ authKey: process.env.AUTH_KEY_MSG91 });

async function sendOtp(phone) {
  try {
    console.log(123);
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });

    console.log("456");
    const res = await otp.send(phone);
    return 1;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

async function verifyOtp(phone, code) {
  try {
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });
    // console.log(123);
    const res = await otp.verify(phone, code);
    console.log(res, "res");
    return 1;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function resendOtp(phone) {
  try {
    let otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", { length: 4 });

    const res = await otp.retry(phone);
    console.log(res, "res");
    return 1;
  } catch (error) {
    return 0;
  }
}

module.exports = { sendOtp, verifyOtp, resendOtp };
