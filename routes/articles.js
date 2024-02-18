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
    { name: "video", maxCount: 1 , optional: true},
    { name: "image1", maxCount: 1, optional: true },
    { name: "image2", maxCount: 1, optional: true },
    ]),
  async (req, res) => {
    try {
      const files = req.files;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      const image = files["image"][0];
      let videoUrl = "";

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

      let article = new Articles({
        title: req.body.title,
        description: req.body.description,
        contenu: req.body.contenu,
        image: `${basePath}${image.filename}`,
        video: videoUrl,
        image1: image1Url,
        image2: image2Url,
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
    const articlesList = await Articles.find().sort({ _id: -1 });
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

router.get(`/get/count`, async (req, res) => {
  const userCount = await Articles.countDocuments();
  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

module.exports = router;
