const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { DevisConversion } = require("../models/DevisConversion");
const nodemailer = require("nodemailer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype] || "file";
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.post(
  "/inscription",
  uploadOptions.fields([
    { name: "cin", maxCount: 1 },
    { name: "patente", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      const cinImage = files["cin"][0];
      const patenteImage = files["patente"][0];

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        fonction: req.body.fonction,
        numero: req.body.numero,
        phone: req.body.phone,
        cin: `${basePath}${cinImage.filename}`,
        patente: `${basePath}${patenteImage.filename}`,
      });

      const savedUser = await user.save();
      if (!savedUser) {
        return res.status(400).send("The user cannot be created!");
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "applicationdeltacuisine@gmail.com",
          pass: "pphexfcjduvckjdv",
        },
      });

      const mailOptions = {
        from: "applicationdeltacuisine@gmail.com",
        to: req.body.email,
        subject: "Inscription Delta cuisine Application",
        html: `
        <html>
          <body>
            <p>Cher(e) partenaire, </p>
            <p>Nous vous exprimons notre gratitude pour avoir choisi Delta Cuisine !</p>
            <p>Actuellement, votre inscription est en cours de validation. Un e-mail de confirmation contenant votre mot de passe vous parviendra dès que votre compte sera validé.</p>
            <p>L'équipe de Delta Cuisine vous accueille chaleureusement.</p>
          </body>
        </html>
      `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          res.status(500).send("Error sending email");
        } else {
          console.log("Email sent:", info.response);

           const adminTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "applicationdeltacuisine@gmail.com",
              pass: "pphexfcjduvckjdv",
            },
          });
  
          const adminMailOptions = {
            from: "applicationdeltacuisine@gmail.com",
            to: "applicationdeltacuisine@gmail.com",
            subject: "Nouveau user Inscrit",
            html: `
              <html>
                <body>
                  <p>Admin,</p>
                  <p>Un nouveau utilisateur s'est inscrit :</p>
                  <p>Nom : ${user.name}</p>
                  <p>ID : ${user._id}</p>
                  <p>E-mail : ${user.email}</p>
                  <p>Nous devons le valider.</p>
                </body>
              </html>
            `,
          };
  
          adminTransporter.sendMail(adminMailOptions, (adminError, adminInfo) => {
            if (adminError) {
              console.error("Error sending admin notification email:", adminError);
            } else {
              console.log("Admin notification email sent:", adminInfo.response);
            }
          });

          res.status(200).send("User created and emails sent successfully");
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating user");
    }
  }
);


router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash").sort({ _id: -1 });

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found." });
  }
  res.status(200).send(user);
});

router.put("/:id", async (req, res) => {
  try {
    const userExist = await User.findById(req.params.id);
    let newPassword;
    if (req.body.password) {
      newPassword = bcrypt.hashSync(req.body.password, 10);
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
        validation: req.body.validation,
        numero: req.body.numero,
      },
      { new: true }
    );

    if (!user) return res.status(400).send("The user cannot be updated!");

    if (req.body.validation === true) {


      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "applicationdeltacuisine@gmail.com",
          pass: "pphexfcjduvckjdv",
        },
      });

      const mailOptions = {
        from: "applicationdeltacuisine@gmail.com",
        to: user.email,
        subject: "Validation compte Delta Cuisine",
        text: `${user.name},\n\Bienvenue dans la communauté Delta Cuisine !
        Nous sommes ravis de vous informer que votre compte a été validé avec succès
        Veuillez trouver ci-dessous votre mot de passe : ${req.body.password}\n\Encore une fois, bienvenue à bord !\n\L'équipe Delta cuisine.
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          res.status(500).send("Error sending email");
        } else {
          console.log("Email sent:", info.response);
          res.status(200).send("Email sent successfully");
        }
      });
    }

    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;
    if (!user) {
      return res.status(400).send("User not found");
    }

    if (!user.validation) {
      return res.status(400).send("User is not validated");
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: "3d" }
      );

      res.status(200).send({ user: user.email, userId: user.id, token: token });
    } else {
      res.status(400).send("Password is incorrect");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

router.delete("/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "user not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.put("/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name, lastname, password, validation } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
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
    res.status(500).send("Error updating user");
  }
});

router.get("/wlc", (req, res) => {
  res.send("Welcome to the backend");
});

router.post("/teste", async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      fonction: req.body.fonction,
    });

    const savedUser = await user.save();
    if (!savedUser) {
      return res.status(400).send("The user cannot be created!");
    }

    res.send(savedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating user");
  }
});

//sejour
router.put("/subtract-points/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pointsToDeduct = 500;
    user.TotalPoint -= pointsToDeduct;
    await user.save();

    // Send user notification email
    const userTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const userMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: user.email,
      subject: "Séjour Confirmé",
      html: `
        <html>
          <body>
            <p>Bonjour ${user.name},</p>
            <p>Votre séjour à l'hôtel a été confirmé. Vous avez échangé 500 points avec succès. Il vous reste actuellement ${user.TotalPoint} points.</p>
            <p>Nous vous contacterons pour plus de détails.</p>
          </body>
        </html>
      `,
    };

    await userTransporter.sendMail(userMailOptions);

    // Send admin notification email
    const adminTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const adminMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points Converti en séjour",
      html: `
        <html>
          <body>
            <p>Admin,</p>
            <p>L'utilisateur ${user.name} : ${userId} avec l'adresse e-mail: ${user.email} et le nom: ${user.name} a échangé 500 points contre un séjour à l'hôtel. Il lui reste actuellement ${user.TotalPoint} points.</p>
            <p>Nous devons le contacter.</p>
          </body>
        </html>
      `,
    };

    await adminTransporter.sendMail(adminMailOptions);

    return res.json({
      message: "Points subtracted successfully",
      updatedUser: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

///point to money
router.put("/convert-points/:userId/:pointsToConvert", async (req, res) => {
  try {
    const userId = req.params.userId;
    const pointsToConvert = parseInt(req.params.pointsToConvert);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const devisConversion = await DevisConversion.findOne();

    if (!devisConversion) {
      return res.status(500).json({ message: "Conversion rate not found" });
    }

    const conversionRate = devisConversion.conversionRate;
    const moneyAmount = pointsToConvert * conversionRate;

    // Send user notification email
    const userTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const userMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: user.email,
      subject: "Conversion en cours",
      html: `
        <html>
          <body>
            <p>Cher(e) partenaire ${user.name},</p>
            <p>Nous avons bien reçu votre demande de conversion de  ${pointsToConvert} points. Pour finaliser cette transaction, veuillez nous faire parvenir une facture de prestation par e-mail. De plus, nous vous prions de déposer la facture l'original chez votre commercial.</p>
            <p>Nous vous remercions pour votre collaboration.</p>
            <p>L'équipe de Delta Cuisine.</p>
          </body>
        </html>
      `,
    };

    await userTransporter.sendMail(userMailOptions);

     user.TotalPoint -= pointsToConvert;
    await user.save();

     const adminTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const adminMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points convertis en argent",
      html: `
        <html>
          <body>
            <p>Admin,</p>
            <p>L'utilisateur ${user.name}:  Id : ${userId} avec l'adresse e-mail: ${user.email} a converti ${pointsToConvert} points,
               ce qui équivaut à un montant total de ${moneyAmount} DT.</p>
            <p>Nous devons le contacter.</p>
          </body>
        </html>
      `,
    };

    await adminTransporter.sendMail(adminMailOptions);
    return res.status(200).json({ moneyAmount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.put(
  "/:userId/update-image",
  uploadOptions.single("image"),
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const file = req.file;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { image: `${basePath}${file.filename}` },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.send(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating user's image");
    }
  }
);
//// voyage
router.put("/voyage/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.TotalPoint -= 1500;
    await user.save();

    // Send user notification email
    const userTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const userMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: user.email,
      subject: "Voyage Confirmé",
      html: `
        <html>
          <body>
            <p>Bonjour ${user.name},</p>
            <p>Votre voyage a été confirmé. Vous avez échangé 1500 points avec succès.</p>
            <p>Nous vous contacterons pour plus de détails.</p>
          </body>
        </html>
      `,
    };

    await userTransporter.sendMail(userMailOptions);

    // Send admin notification email
    const adminTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const adminMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points Converti en voyage",
      html: `
        <html>
          <body>
            <p>Admin,</p>
            <p>L'utilisateur ${user.name} : ${userId} avec l'adresse e-mail: ${user.email} a échangé 1500 points contre un voyage.</p>
            <p>Nous devons le contacter.</p>
          </body>
        </html>
      `,
    };

    await adminTransporter.sendMail(adminMailOptions);

    return res.json({
      message: "Points subtracted successfully",
      updatedUser: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

 
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ exists: true });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

////voyage /sejour 

router.put("/sejourVoyage/:userId/:pointsToConvert", async (req, res) => {
  try {
    const userId = req.params.userId;
    const pointsToConvert = parseInt(req.params.pointsToConvert);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

 
    // Send user notification email
    const userTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const userMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: user.email,
      subject: "Conversion en cours",
      html: `
        <html>
          <body>
            <p>Cher(e) partenaire ${user.name},</p>
            <p>Nous avons bien reçu votre demande de conversion de ${pointsToConvert} points en Séjour/Voyage . 
             <p>Nous vous remercions pour votre collaboration.</p>
            <p>L'équipe de Delta Cuisine.</p>
          </body>
        </html>
      `,
    };

    await userTransporter.sendMail(userMailOptions);

     user.TotalPoint -= pointsToConvert;
    await user.save();

     const adminTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const adminMailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points convertis en argent",
      html: `
        <html>
          <body>
            <p>Admin,</p>
            <p>L'utilisateur ${user.name}:  Id : ${userId} avec l'adresse e-mail: ${user.email} a converti ${pointsToConvert} points,
               en séjour/ voyage</p>
            <p>Nous devons le contacter.</p>
          </body>
        </html>
      `,
    };

    await adminTransporter.sendMail(adminMailOptions);
    return res.status(200).json({ message: "Points subtracted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
      const userId = req.params.id;
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
          return res.status(404).send({ message: 'User not found' });
      }

      res.status(200).send({ message: 'User deleted successfully' });
  } catch (error) {
      res.status(500).send({ message: 'Error deleting user', error: error.message });
  }
});



module.exports = router;
