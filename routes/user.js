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
            <p>Merci pour votre inscription chez Delta Cuisine !</p>
            <p>Votre compte est en cours de validation. Vous recevrez un e-mail de confirmation contenant votre mot de passe une fois que votre compte aura été validé.</p>
            <p>L'équipe de Delta Cuisine vous souhaite la bienvenue.</p>
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
          res.status(200).send("Email sent successfully");
        }
      });

      res.send(savedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating user");
    }
  }
);

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");

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
        subject: "Account Validation",
        text: `${user.name},\n\Votre compte a été validé avec succès,
        Voici votre nouveau mot de passe : ${req.body.password}\n\nBienvenue\n\L'équipe Delta cuisine.
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
        { expiresIn: "3h" }
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

router.put("/subtract-points/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.TotalPoint -= 500;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });
    const mailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points Converti en séjour",
      html: `
        <html>
          <body>
            <p> Admin,</p>
            <p> L'utilisateur : ${userId} avec l'adresse e-mail: ${user.email} , et le nom: ${user.name} 
            a échangé 500 points contre un séjour à l'hôtel. Il lui reste actuellement ${user.TotalPoint}</p>
            <p>Nous devons le contacter.</p>
          </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    return res.json({
      message: "Points subtracted successfully",
      updatedUser: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

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

    const conversionrate = devisConversion.conversionRate;
    const moneyAmount = pointsToConvert * conversionrate;
    user.TotalPoint -= pointsToConvert;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const mailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points converti en argent",
      html: `
          <html>
            <body>
              <p>Admin,</p>
              <p>L'utilisateur: ${userId} avec l'adresse e-mail: ${user.email} a converti ${pointsToConvert} points,
               ce qui équivaut à un montant total de  ${moneyAmount} DT.</p>
              <p>Nous devons le contacter.</p>
            </body>
          </html>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

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

router.put("/voyage/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.TotalPoint -= 1500;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

    const mailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "applicationdeltacuisine@gmail.com",
      subject: "Points Converti en voyage",
      html: `
        <html>
          <body>
            <p> Admin,</p>
            <p>L'utilisateur: ${userId} avec l'adresse e-mail: ${user.email} a échangé 1500 points contre un voyage. </p>
            <p>Nous devons le contacter.</p>
          </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    return res.json({
      message: "Points subtracted successfully",
      updatedUser: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
