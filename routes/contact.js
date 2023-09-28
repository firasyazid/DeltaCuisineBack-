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
    let documentPath = "";  

     
    if (req.file) {
      const fileName = req.file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      documentPath = `${basePath}${fileName}`;
    }

     let contact = new Contact({
      name: req.body.name,
       message: req.body.message,
      devis: req.body.devis,
      document: documentPath,  
      user: req.body.user,
      client:req.body.client
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
     const contactList = await Contact.find().populate('user');

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


router.delete("/:id", (req, res) => {
  Contact.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the contact is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "contact not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});


module.exports = router;
