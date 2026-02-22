const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const User = require("./models/user");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

mongoose.connect("mongodb://127.0.0.1:27017/true-properties")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const Property = require("./models/property");

// Image Upload Setup
const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Add Property
app.post("/add-property", upload.single("image"), async (req, res) => {
    try {
      const newProperty = new Property({
        propertyType: req.body.propertyType,
        dealType: req.body.dealType,
        location: req.body.location,
        price: req.body.price,
        contact: req.body.contact,
        image: req.file.filename
        
      });
  
      await newProperty.save();
      res.redirect("/");
  
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  //registration 

  

app.post("/login", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.redirect("/registration-success.html");
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});

  
// Get All Properties
app.get("/properties", async (req, res) => {
    try {
      const { location, minPrice, maxPrice } = req.query;
  
      let filter = {};
  
      // Location filter
      if (location && location !== "") {
        filter.location = { $regex: location, $options: "i" };
      }
  
      // Price filter
      if (minPrice || maxPrice) {
        filter.price = {};
  
        if (minPrice && minPrice !== "") {
          filter.price.$gte = Number(minPrice);
        }
  
        if (maxPrice && maxPrice !== "") {
          filter.price.$lte = Number(maxPrice);
        }
      }
  
      console.log("Filter Applied:", filter); // DEBUG LINE
  
      const properties = await Property.find(filter);
  
      res.json(properties);
  
    } catch (err) {
      res.status(500).json({ message: "Error searching properties" });
    }
  });
  
  
  
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });