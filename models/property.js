const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({
  propertyType: {
    type: String,
    enum: ["House", "Flat", "Plot", "Villa"],
    required: true
  },
  dealType: {
    type: String,
    enum: ["Sell", "Rent"],
    required: true
  },
  location: String,
  area: Number,
  price: Number,
  contact: String,
  image: String
}, { timestamps: true });

module.exports = mongoose.model("Property", PropertySchema);
