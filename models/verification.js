const mongoose = require("mongoose")

const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

const VerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: "Email address is required",
        validate: [validateEmail, "Please fill a valid email address"],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
        ],
    },
    code: {
        type: Number,
        required: true,
    },
    dateCreated: {
        type: Date
    }
})

module.exports = mongoose.model("Verification", VerificationSchema, "Verifications")