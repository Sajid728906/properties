const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const User = require("./models/user");
const app = express();
const sharp = require('sharp');
const fs = require('fs');
const compression = require('compression');


/* add security*/
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* add security */
app.use(session({

  secret:'mysecretkey',

  resave:false,

  saveUninitialized:false,

  cookie:{
      maxAge:1000 * 60 * 60 * 24
  }

}));

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

app.post("/add-property",
upload.array("images",10),

async(req,res)=>{

try{

const optimizedImages = [];

for(const file of req.files){

const newFilename =
"optimized-" + file.filename;

await sharp(file.path)

.resize(800)

.jpeg({quality:70})

.toFile(
"./public/uploads/" + newFilename
);

fs.unlinkSync(file.path);

optimizedImages.push(newFilename);

}

const newProperty = new Property({

propertyType:req.body.propertyType,

dealType:req.body.dealType,

location:req.body.location,

price:req.body.price,

contact:req.body.contact,

images:optimizedImages,

user:req.session.user._id

});

await newProperty.save();

res.redirect('/dashboard');

}catch(err){

console.log(err);

}

});
  //registration 

  

  app.post('/login', async(req,res)=>{

    try{

        const {email,password} = req.body;

        // existing user find
        const user = await User.findOne({email});

        // no signup
        if(!user){

            return res.send("Please signup first");

        }

        // compare password
        const isMatch =
        await bcrypt.compare(password,user.password);

        // wrong password
        if(!isMatch){

            return res.send("Wrong password");

        }

        // login success
        req.session.isLoggedIn = true;

        req.session.user = user;

        res.redirect('/properties.html');

    }catch(err){

        console.log(err);

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
  
  //add security

  app.post('/signup', async(req,res)=>{

    try{

        const {name,age,email,password,phone} = req.body;

        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.send("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const user = new User({

            name,
            age,
            email,
            password:hashedPassword,
            phone

        });

        await user.save();

        res.redirect('/login.html');

    }catch(err){

        console.log(err);

    }

});

app.get('/add', (req,res)=>{

  if(req.session.isLoggedIn){

      res.sendFile(__dirname + '/public/add.html');

  }else{

      res.redirect('/login.html');

  }

});
app.get('/', (req,res)=>{
  //already login
  if(req.session.isLoggedIn){
    res.redirect('/index.html');
  }else{
    //not login
    res.redirect('/login.html');
  }

});

app.get('/check-login',(req,res)=>{

  if(req.session.isLoggedIn){

      res.json({loggedIn:true});

  }else{

      res.json({loggedIn:false});

  }

});

app.get('/logout',(req,res)=>{

  req.session.destroy(()=>{
      res.redirect('/login.html');
  });

});

app.post('/forgot-password', async(req,res)=>{

  const user = await User.findOne({
      email:req.body.email
  });

  if(!user){
      return res.send("No account with this email");
  }

  const token = crypto.randomBytes(32).toString('hex');

  user.resetToken = token;

  user.resetTokenExpiry = Date.now() + 3600000;

  await user.save();

  const transporter = nodemailer.createTransport({

      service:'gmail',

      auth:{
          user:'shekhsajid8287@gmail.com',
          pass:'mvdv huqb wfqa tslv'
      }

  });


  const resetLink =
  `http://127.0.0.1:8000/reset-password/${token}`;

  await transporter.sendMail({

      to:user.email,

      subject:'Password Reset',

      html:`
      <h2>Password Reset</h2>

      <a href="${resetLink}">
          Reset Password
      </a>
      `

  });

  res.send("Reset link sent to email");

});

//check

app.get('/dashboard', async(req,res)=>{

  // login required
  if(!req.session.isLoggedIn){

      return res.redirect('/login.html');

  }

  try{

      // current user properties
      const properties = await Property.find({

          user:req.session.user._id

      });

      let html = `

<!DOCTYPE html>
<html>
<head>

<title>Dashboard</title>

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial,sans-serif;
}

body{
    background:#f5f5f5;
}

.dashboard{
    display:flex;
    min-height:100vh;
}

/* SIDEBAR */

.sidebar{
    width:260px;
    background:#0b1c39;
    color:#fff;
    padding:30px 20px;
}

.sidebar h2{
    margin-bottom:40px;
}

.sidebar a{
    display:block;
    color:#fff;
    text-decoration:none;
    margin-bottom:20px;
    padding:12px;
    border-radius:8px;
    transition:0.3s;
}

.sidebar a:hover{
    background:#16315f;
}

/* MAIN */

.main{
    flex:1;
    padding:40px;
}

.topbar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:30px;
}

.topbar h1{
    color:#222;
}

.add-btn{
    background:#0b5d3b;
    color:#fff;
    padding:12px 20px;
    border-radius:8px;
    text-decoration:none;
    font-weight:bold;
}

/* TABLE */

table{
    width:100%;
    background:#fff;
    border-collapse:collapse;
    border-radius:10px;
    overflow:hidden;
    box-shadow:0 5px 15px rgba(0,0,0,0.1);
}

table th{
    background:#f1f1f1;
    padding:15px;
    text-align:left;
}

table td{
    padding:15px;
    border-bottom:1px solid #eee;
}

table img{
    width:90px;
    height:70px;
    object-fit:cover;
    border-radius:8px;
}

.edit-btn{
    color:blue;
    text-decoration:none;
    margin-right:15px;
}

.delete-btn{
    color:red;
    text-decoration:none;
}

</style>

</head>

<body>

<div class="dashboard">

    <!-- SIDEBAR -->

    <div class="sidebar">

        <h2>
          Welcome,
          ${req.session.user.name}
        </h2>

        <a href="/properties.html">
          Properties
        </a>

        <a href="/dashboard">
          My Properties
        </a>

        <a href="/add.html">
          Add Property
        </a>

        <a href="/logout">
          Logout
        </a>

        <a href="/">
         Home
        </a>

    </div>

    <!-- MAIN -->

    <div class="main">

        <div class="topbar">

            <h1>My Properties</h1>

            <a href="/add.html" class="add-btn">
              Add New Property
            </a>

        </div>

        <table>

            <tr>

                <th>Image</th>

                <th>Property</th>

                <th>Location</th>

                <th>Price</th>

                <th>Actions</th>

            </tr>

`;

      // show all properties
      properties.forEach(property=>{

        html += `
        
        <tr>
        
        <td>
        
        <img src="/uploads/${
          property.images && property.images.length > 0
          ? property.images[0]
          : property.images
          }">
        
        </td>
        
        <td>
        
        ${property.propertyType}
        
        (${property.dealType})
        
        </td>
        
        <td>
        
        ${property.location}
        
        </td>
        
        <td>
        
        ₹ ${property.price}
        
        </td>
        
        <td>
        
        <a
          href="/edit-property/${property._id}"
          class="edit-btn"
        >
        Edit
        </a>
        
        <a
          href="/delete-property/${property._id}"
          class="delete-btn"
        >
        Delete
        </a>
        
        </td>
        
        </tr>
        
        `;
        
        });

        html += `
</table>

</div>

</div>

</body>
</html>
`;

      res.send(html);

  }catch(err){

      console.log(err);

  }

});

app.get('/delete-property/:id',
async(req,res)=>{

    // login required
    if(!req.session.isLoggedIn){

        return res.redirect('/login.html');

    }

    try{

        // only own property delete
        await Property.findOneAndDelete({

            _id:req.params.id,

            user:req.session.user._id

        });

        res.redirect('/dashboard');

    }catch(err){

        console.log(err);

    }

});



app.get('/edit-property/:id', async(req,res)=>{

  // login required
  if(!req.session.isLoggedIn){

      return res.redirect('/login.html');

  }

  try{

      const property = await Property.findOne({

          _id:req.params.id,

          user:req.session.user._id

      });

      if(!property){

          return res.send("Property not found");

      }

      res.send(`

<!DOCTYPE html>
<html>
<head>

<title>Edit Property</title>

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial,sans-serif;
}

body{
    background:#f5f5f5;
    display:flex;
    justify-content:center;
    align-items:center;
    min-height:100vh;
    padding:20px;
}

.container{
    width:100%;
    max-width:500px;
    background:white;
    padding:35px;
    border-radius:15px;
    box-shadow:0 5px 20px rgba(0,0,0,0.1);
}

h1{
    text-align:center;
    margin-bottom:25px;
    color:#222;
}

form{
    display:flex;
    flex-direction:column;
    gap:15px;
}

input{
    width:100%;
    padding:12px;
    border:1px solid #ccc;
    border-radius:8px;
    font-size:15px;
}

.image-box{
    display:flex;
    flex-wrap:wrap;
    gap:10px;
}

.image-box img{
    width:120px;
    height:90px;
    object-fit:cover;
    border-radius:10px;
    border:2px solid #eee;
}

button{
    background:#0b5d3b;
    color:white;
    border:none;
    padding:14px;
    border-radius:8px;
    font-size:16px;
    cursor:pointer;
    font-weight:bold;
}

button:hover{
    background:#08492d;
}

label{
    font-weight:bold;
    color:#444;
}

</style>

</head>

<body>

<div class="container">

<h1>Edit Property</h1>

<form 
  action="/update-property/${property._id}" 
  method="POST"
  enctype="multipart/form-data"
>

    <input
      type="text"
      name="propertyType"
      value="${property.propertyType}"
      placeholder="Property Type"
    >

    <input
      type="text"
      name="location"
      value="${property.location}"
      placeholder="Location"
    >

    <input
      type="number"
      name="price"
      value="${property.price}"
      placeholder="Price"
    >

    <label>
      Current Images:
    </label>

    <div class="image-box">

    ${
      (
      property.images && property.images.length > 0
      ? property.images
      : [property.images]
      ).map(img => `
      
      <img src="/uploads/${img}">
      
      `).join("")
    }

    </div>

    <label>
      Upload New Images
    </label>

    <input
      type="file"
      name="images"
      multiple
    >

    <button type="submit">
        Update Property
    </button>

</form>

</div>

</body>
</html>

`);

  }catch(err){

      console.log(err);

  }

});

app.post(
  '/update-property/:id',
  upload.array("images",10),
  
  async(req,res)=>{
  
      if(!req.session.isLoggedIn){
  
          return res.redirect('/login.html');
  
      }
  
      try{
  
          // old property find
          const property =
          await Property.findOne({
  
              _id:req.params.id,
  
              user:req.session.user._id
  
          });
  
          if(!property){
  
              return res.send(
                "Property not found"
              );
  
          }
  
          // old images preserve
          let updatedImages =
          property.images || [];
  
          // new uploaded images
          if(req.files && req.files.length > 0){

            const newImages =
            req.files.map(
              file => file.filename
            );
        
            // old + new images
            updatedImages = [
              ...updatedImages,
              ...newImages
            ];
        
        }
  
          await Property.findOneAndUpdate(
  
              {
                  _id:req.params.id,
  
                  user:req.session.user._id
              },
  
              {
  
                  propertyType:
                  req.body.propertyType,
  
                  location:
                  req.body.location,
  
                  price:
                  req.body.price,
  
                  images:updatedImages
  
              }
  
          );
  
          res.redirect('/dashboard');
  
      }catch(err){
  
          console.log(err);
  
      }
  
  });
  app.get('/reset-password/:token',
(req,res)=>{

res.send(`

<!DOCTYPE html>
<html>
<head>

<title>Reset Password</title>

<style>

body{
    font-family:Arial;
    background:#f5f5f5;

    display:flex;
    justify-content:center;
    align-items:center;

    height:100vh;
}

.box{
    background:white;
    padding:40px;
    border-radius:15px;
    width:350px;

    box-shadow:0 5px 20px rgba(0,0,0,0.1);
}

h1{
    text-align:center;
    margin-bottom:25px;
}

input{
    width:100%;
    padding:12px;
    margin-bottom:20px;

    border:1px solid #ccc;
    border-radius:8px;
}

button{
    width:100%;
    padding:12px;

    background:#0b5d3b;
    color:white;

    border:none;
    border-radius:8px;

    font-size:16px;
    cursor:pointer;
}

</style>

</head>

<body>

<div class="box">

<h1>Reset Password</h1>

<form
 action="/reset-password/${req.params.token}"
 method="POST"
>

<input
 type="password"
 name="password"
 placeholder="New Password"
 required
>

<button type="submit">
   Reset Password
</button>

</form>

</div>

</body>
</html>

`);

});
app.post('/reset-password/:token',
async(req,res)=>{

    const user = await User.findOne({

        resetToken:req.params.token,

        resetTokenExpiry:{
            $gt:Date.now()
        }

    });

    if(!user){
        return res.send("Token expired");
    }

    const hashedPassword =
    await bcrypt.hash(req.body.password,10);

    user.password = hashedPassword;

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.redirect('/login.html');

});

  
  app.listen(8000, '0.0.0.0',() => {
    console.log("Server running on http://localhost:8000");
  });
