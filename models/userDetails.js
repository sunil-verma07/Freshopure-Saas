const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  img: {
    type: String,
  },
});

module.exports = mongoose.model(
  "UserDetails",
  UserDetailsSchema,
  "UserDetails"
);
