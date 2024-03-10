const { Produits } = require("../models/produits");
const express = require("express");
const router = express.Router();
const multer = require("multer");


const FILE_TYPE_MAP = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
  };
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const isValid = FILE_TYPE_MAP[file.mimetype];
      let uploadError = new Error("invalid image type");
      if (isValid) {
        uploadError = null;
      }
      cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(" ").join("-");
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
  });
  
  const uploadOptions = multer({ storage: storage });
  
  router.post(
    "/",
    uploadOptions.fields([
      { name: "image", maxCount: 1 , optional: true},
      { name: "video", maxCount: 1 , optional: true},
      { name: "image1", maxCount: 1 , optional: true},
      { name: "image2", maxCount: 1 , optional: true},
      { name: "image3", maxCount: 1 , optional: true},
    ]),
    async (req, res) => {
      try {
        const files = req.files;
        const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  
        const image = files["image"][0];
        let videoUrl = null;
  
        if (files["video"]) {
           const video = files["video"][0];
          videoUrl = `${basePath}${video.filename}`;
        }

        
      let image1Url = "";
      if (files["image1"]) {
        const image1 = files["image1"][0];
        image1Url = `${basePath}${image1.filename}`;
      }
      let image2Url = "";
      if (files["image2"]) {
        const image2 = files["image2"][0];
        image2Url = `${basePath}${image2.filename}`;
      }
          let image3Url = "";
      if (files["image3"]) {
        const image3 = files["image3"][0];
        image3Url = `${basePath}${image3.filename}`;
      }
  
        let produits = new Produits({
          title: req.body.title,
          description: req.body.description,
          contenu: req.body.contenu,
          image: `${basePath}${image.filename}`,
          video: videoUrl,  
          image1: image1Url,
          image2: image2Url,
          image3: image3Url,

        });
        produits = await produits.save();
        if (!produits) {
          return res.status(500).send("The produits cannot be created");
        }
  
        res.send(produits);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    }
  );
  
  router.get("/", async (req, res) => {
    try {
      const produits = await Produits.find().sort({ _id: -1 });
      if (!produits) {
        return res.status(500).json({ success: false });
      }
      res.status(200).send(produits);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
  

  router.delete("/:id", (req, res) => {
    Produits.findByIdAndRemove(req.params.id)
      .then((prod) => {
        if (prod) {
          return res
            .status(200)
            .json({ success: true, message: "the products is deleted!" });
        } else {
          return res
            .status(404)
            .json({ success: false, message: "products not found!" });
        }
      })
      .catch((err) => {
        return res.status(500).json({ success: false, error: err });
      });
  });
  
  router.put("/:id", uploadOptions.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 , optional: true},
    { name: "image1", maxCount: 1, optional: true },
    { name: "image2", maxCount: 1, optional: true },
    { name: "image3", maxCount: 1, optional: true },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  
      const articleId = req.params.id;
      let article = await Produits.findById(articleId);
  
      if (!article) {
        return res.status(404).send("Produit not found");
      }
  
       if (req.body.title) {
        article.title = req.body.title;
      }
      if (req.body.contenu) {
        article.contenu = req.body.contenu;
      }
  
       if (files["image"]) {
        const image = files["image"][0];
        article.image = `${basePath}${image.filename}`;
      }
      if (files["video"]) {
        const video = files["video"][0];
        article.video = `${basePath}${video.filename}`;
      }
      if (files["image1"]) {
        const image1 = files["image1"][0];
        article.image1 = `${basePath}${image1.filename}`;
      }
      if (files["image2"]) {
        const image2 = files["image2"][0];
        article.image2 = `${basePath}${image2.filename}`;
      }
      if (files["image3"]) {
        const image3 = files["image3"][0];
        article.image3 = `${basePath}${image3.filename}`;
      }
  
      article = await article.save();
  
      if (!article) {
        return res.status(500).send("The produit cannot be updated");
      }
  
      res.send(article);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
  );
  
  router.get("/:id", async (req, res) => {
    const user = await Produits.findById(req.params.id);
    if (!user) {
      res
        .status(500)
        .json({ message: "The produit with the given ID was not found." });
    }
    res.status(200).send(user);
  });


  
  module.exports = router;