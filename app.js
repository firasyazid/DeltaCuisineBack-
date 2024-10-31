const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const errorHandler = require("./middleware/error");
const api = process.env.API_URL;
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
const port = process.env.PORT || 3001;

//Middleware
app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());
app.options("*", cors());
app.use(errorHandler);

const userRouter = require("./routes/user");
const devisRouter = require("./routes/devis");
const articlesRouter = require("./routes/articles");
const contactRouter = require("./routes/contact");
const produitsRouter = require("./routes/produits");
const catalogueRouter = require("./routes/catalogue");
const showroomRouter = require("./routes/showroom");
const ConversionRouter = require("./routes/conversion");
const LivraisonRouter = require("./routes/livraison");
const CommandeRouter = require("./routes/commande");
const CommercialRouter = require("./routes/commercial");
const userPushTokenSchema = require("./routes/userPushToken");  
  
//Routes
app.use(`${api}/users`, userRouter);
app.use(`${api}/devis`, devisRouter);
app.use(`${api}/articles`, articlesRouter);
app.use(`${api}/contacts`, contactRouter);
app.use(`${api}/produits`, produitsRouter);
app.use(`${api}/catalogues`, catalogueRouter);
app.use(`${api}/showrooms`, showroomRouter);
app.use(`${api}/conversions`, ConversionRouter);
app.use(`${api}/livraisons`, LivraisonRouter);
app.use(`${api}/commandes`, CommandeRouter);
app.use(`${api}/commercials`, CommercialRouter);
app.use(`${api}/userPushTokens`, userPushTokenSchema);
 

//Database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "DeltaCuisine",
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Hello it's Firass , This is a Delta Cuisine application third VERSION.");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
