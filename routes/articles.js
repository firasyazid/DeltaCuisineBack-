const { Articles } = require("../models/article");
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
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      const image = files["image"][0];
      const video = files["video"][0];

      let article = new Articles({
        title: req.body.title,
        description: req.body.description,
        contenu: req.body.contenu,
        image: `${basePath}${image.filename}`,
        video: `${basePath}${video.filename}`,
      });

      article = await article.save();
      if (!article) {
        return res.status(500).send("The article cannot be created");
      }

      res.send(article);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const articlesList = await Articles.find();
    if (!articlesList) {
      return res.status(500).json({ success: false });
    }
    res.status(200).send(articlesList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", (req, res) => {
  Articles.findByIdAndRemove(req.params.id)
    .then((prod) => {
      if (prod) {
        return res
          .status(200)
          .json({ success: true, message: "the Articles is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Articles not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});


module.exports = router;
