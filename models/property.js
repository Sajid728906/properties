const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({

    propertyType:String,

    dealType:String,

    location:String,

    price:Number,

    contact:String,

    images:[String],

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }

});

module.exports = mongoose.model("Property", propertySchema);