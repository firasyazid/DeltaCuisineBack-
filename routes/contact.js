const { Contact } = require("../models/contact");
const express = require("express");
const router = express.Router();
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
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

 
router.post(`/`, uploadOptions.single("document"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("No image in the request");

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    let contact = new Contact({
      name: req.body.name,
      sujet: req.body.sujet,
      message: req.body.message,
      document: `${basePath}${fileName}`,
    });

    contact = await contact.save();
    if (!contact) return res.status(500).send("The contact cannot be created");

    res.send(contact);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

router.get(`/`, async (req, res) => {
  try {
    const contactList = await Contact.find();
    if (!contactList) {
      return res.status(500).json({ success: false });
    }
    res.status(200).send(contactList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

router.get(`/:id`, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(500).json({ success: false });
    }
    res.send(contact);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
