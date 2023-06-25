const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');

 
    
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
      cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
  })

  const uploadOptions = multer({ storage: storage });




  router.post('/inscription', uploadOptions.fields([
    { name: 'cin', maxCount: 1 },
    { name: 'patente', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files;
      const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
  
      const cinImage = files['cin'][0];
      const patenteImage = files['patente'][0];
  
      const user = new User({
        name: req.body.name,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        cin: `${basePath}${cinImage.filename}`,
        patente: `${basePath}${patenteImage.filename}`,
       });
  
      const savedUser = await user.save();
  
      if (!savedUser) {
        return res.status(400).send('The user cannot be created!');
      }
  
      res.send(savedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creating user');
    }
  });
  




router.get(`/`, async (req, res) =>{
    const userList = await User.find().select('-passwordHash');

    if(!userList) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(userList);
})


router.get('/:id', async(req,res)=>{
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user) {
        res.status(500).json({message: 'The user with the given ID was not found.'})
    } 
    res.status(200).send(user);
}) 


router.put('/:id',async (req, res)=> {

    const userExist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            validation:req.body.validation,
          },
     )

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})


 
router.post('/login', async (req,res) => {
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.secret;
    if(!user) {
        return res.status(400).send('The user not found');
    }

    if (!user.validation) {
        return res.status(400).send('User is not validated');
      }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn : '30d'}
        )
       
        res.status(200).send({user: user.email , token: token}) 
    } else {
       res.status(400).send('password is wrong!');
    }

    
})


router.get(`/get/count`, async (req, res) =>{
    const userCount = await User.countDocuments()
    if(!userCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        userCount: userCount
    });
})


router.delete('/:id', (req, res)=>{
    User.findByIdAndRemove(req.params.id).then(user =>{
        if(user) {
            return res.status(200).json({success: true, message: 'the user is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "user not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})


 
router.put('/update/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { email, name, lastname, password, validation } = req.body;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      if (email) {
        user.email = email;
      }
  
      if (name) {
        user.name = name;
      }
  
      if (lastname) {
        user.lastname = lastname;
      }
  
      if (password) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user.passwordHash = hashedPassword;
      }
  
      if (validation !== undefined) {
        user.validation = validation;
      }
  
      await user.save();
  
      res.status(200).send(user);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating user');
    }
  });
  
  
module.exports =router;