const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String,
    password: String,
    phone: String,

    resetToken:String,
    resetTokenExpiry:Date
    
  });

module.exports = mongoose.model("user", userSchema);
