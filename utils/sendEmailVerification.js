const verification = require("../models/verification");
const Sib = require('sib-api-v3-sdk');
// const SibApiV3Sdk =require('sib-api-v3-sdk');


function generateVerificationCode() {
    const max = 999999;
    const min = 100000;
    let code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code;
}
function sendEmailVerification(email, callback) {
    let code = generateVerificationCode();
    const reqBody = {
        userEmail: email,
        code: code
    };
    sendMail(email, code);
    // console.log(email, code);
    fetch(
        "https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/createVerification?secret=alwaysShine",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(reqBody),
        }
    )
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // console.log("Request succeeded with JSON response", data);
            return callback(null);
        })
        .catch(function (error) {
            console.log("Request failed", error);
            return callback(error);
        });
}

function sendMail(email, code) {
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

    const tranEmailApi = new Sib.TransactionalEmailsApi()
    const sender = {
        email: 'info@freshopure.com',
        name: 'Freshopure',
    };
    const receivers = [
        {
            email: email,
        },
    ];

    tranEmailApi
        .sendTransacEmail({
            sender,
            to: receivers,
            subject: 'Verification Code',
            htmlContent: `
        Your one time verification code is -
            <h1>${code}</h1>
        This is a one time verification code.
        Thank you for registering at LetUsFarm`
        })
        .then(console.log)
        .catch(console.log);
}

async function checkVerification(email, code, callback) {
    const verification = await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getVerificationByEmail?secret=alwaysShine&userEmail="+email, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            return data;
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
    if (verification) {
        const currDate = Date.now();
        if (currDate - verification.createdAt > 600000) {
            sendEmailVerification(email, function (error) {
                if (error) return callback(error);
                else {
                    return callback("Code Expired. We have sent a new verification Code");
                }
            });
        }
        else if (verification.code == code) {
            const reqBody = {
                userEmail: email,
                verificationStatus: true
            }
            fetch(
                "https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/updateUserEmailVerificationStatusByEmail?secret=alwaysShine",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: JSON.stringify(reqBody),
                }
            )
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    // console.log("send response")
                    return callback(null,true);
                })
                .catch(function (error) {
                    console.log("Request failed", error);
                    return callback(error);
                });
        }
        else {
            return callback("Incorrect Code");
        }
    } else {
        sendEmailVerification(email, function (error) {
            if (error) return callback(error);
            else {
                return callback("We have sent a verification Code");
            }
        })
    }
}




module.exports ={ sendEmailVerification,checkVerification,sendMail}