const express = require('express');
const app = express(); 
const morgan = require('morgan');
 const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const authJwt = require('./middleware/jwt');
const errorHandler = require('./middleware/error');
const api = process.env.API_URL;
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
 

//Middleware
app.use(morgan('tiny'));
app.use(express.json()); 
app.use(cors()); 
app.options('*',cors ());
app.use(authJwt());
app.use(errorHandler);

 const userRouter = require ('./routes/user');
 const devisRouter = require ('./routes/devis');
 const articlesRouter = require ('./routes/articles');
 const contactRouter = require ('./routes/contact');
 const produitsRouter = require ('./routes/produits');
const catalogueRouter = require('./routes/catalogue');
const showroomRouter = require('./routes/showroom');
 
//Routes 
 app.use(`${api}/users`, userRouter);
 app.use(`${api}/devis`, devisRouter);
 app.use(`${api}/articles`, articlesRouter);
 app.use(`${api}/contacts`, contactRouter);
 app.use(`${api}/produits`, produitsRouter);
 app.use(`${api}/catalogues`, catalogueRouter);
 app.use(`${api}/showrooms`, showroomRouter);


 

 
//Database
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
   dbName: 'DeltaCuisine'
})
.then(()=>{
  console.log('Database Connection is ready...')
})
.catch((err)=> {
  console.log(err);
})
 
app.listen(3000, ()=>{
     console.log('server is running http://localhost:3000');
})