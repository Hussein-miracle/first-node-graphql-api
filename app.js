const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require("cors");
const {clearImage} = require('./utils/file');
// console.log(" clearImage", clearImage)

const PORT = process.env.PORT || 8080;

const { graphqlHTTP } = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middlewares/auth');
const app = express();

const fileStorage = multer.diskStorage({
  destination: (req,file,cb) => {
    cb(null,"images")
  },
  filename:(req,file,cb) => {
    const uniqueSuffix = Date.now();
    const name = (uniqueSuffix + '-' + file.originalname).trim();
    cb(null, name);
  }
})


const fileFilter = (req,file,cb) => {

  if(file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'){
    cb(null,true)
  }else{
    cb(null,false);
  }

}

const MONGO_DB_URI = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.d96pl5j.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;

// const feedRoutes = require("./routes/feed");
// const authRoutes = require("./routes/auth");
// const maxSize = 20 * 1024 * 1024 * 1024;
// console.log("app.js line-43 maxSize", maxSize)

// app.use(cors())

// ? app.use(bodyParser.urlencoded({extended: false}))  // x-www-form-urlencoded

// app.use(bodyParser.urlencoded({limit: '50mb',extended:true})); // * json
app.use(bodyParser.json()); // * application/json

app.use(multer({ 
  storage:fileStorage,
  fileFilter:fileFilter
}).single('image'));

app.use("/images",express.static(path.join(__dirname,"images"))); // * json

// console.log(path.join(__dirname,"/images"))
// THIS IS DEON TO GET RID OF CORS ERRORS ON THE FRONTEND

app.use((req, res, next) => {
  //THIS IS  ALLOWED TO LET ANY DOMAIN HAVE ACCESS TO OUR API EMDPINTS
  res.setHeader("Access-Control-Allow-Origin", "*");
  //THIS IS  ALLOWED TO LET CLIENT KNOW THE METHODS WE WANT TO OUR API ENDPOINTS TO WORK WITH
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  
  if(req.method === "OPTIONS"){
    return res.sendStatus(200);
  }
  next();
});

// app.use("/feed", feedRoutes);
// app.use("/auth", authRoutes);

app.use(auth);

app.put('/post-image',(req,res,next) => {
  if(!req.isAuth){
    const error = new Error("Not authenticated!.");
    error.code = 401;
    throw error;
  }

  if(!req.file){
    return res.status(200).json({
      message:"No file provided."
    })
  }

  if(!!req.body.oldPath){
    clearImage(req.body.oldPath);
  }

  return res.status(201).json({
    message:"File Stored.",
    filePath:req.file?.path,
  })
})



app.use("/graphql",graphqlHTTP({
  schema:graphqlSchema,
  rootValue: graphqlResolver,
  graphiql:true,
  customFormatErrorFn(err){
    if(!err.originalError){
      return err;
    }
    
    const  {data} = err?.originalError;
    const message = err.message || "An error occurred."
    const code = err.originalError?.code || 500;


    return {
      message,
      data,
      status: code
    }
  }
}))
app.use((error,req,res,next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message:message.
    data,
  })
})
mongoose
  .connect(MONGO_DB_URI)
  .then((result) => {
    app.listen(PORT, () => {
      console.log(`Connected on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

  // const clearImage = filePath => {
  //   filePath = path.join(__dirname, ".." , filePath);
  //   fs.unlink(filePath , err => console.log(err));
  // }