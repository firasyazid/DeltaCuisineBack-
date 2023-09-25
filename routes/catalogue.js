const {Catalogue} = require("../models/catalogue");
const express = require("express");
const router = express.Router();
const multer = require("multer");

const FILE_TYPE_MAP = {
    "application/pdf": "pdf",  

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




router.post(`/`,uploadOptions.single('catalogue'), async (req, res) =>{
 
    const fileName = req.file.filename
   const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let catalogue = new Catalogue({
         catalogue:`${basePath}${fileName}` ,
     })

     catalogue = await catalogue.save();

    if(!catalogue) 
    return res.status(500).send('The catalogue cannot be created')

    res.send(catalogue);
})


router.get(`/`, async (req, res) => {
    const cat = await Catalogue.find();
  
    if (!cat) {
      res.status(500).json({ success: false });
    }
    res.status(200).send(cat);
  });



module.exports =router;