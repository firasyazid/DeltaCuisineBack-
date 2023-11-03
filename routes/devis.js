const { Devis } = require("../models/devis");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");




router.get(`/get/count`, async (req, res) => {

  const Count = await Devis.countDocuments();

  if (!Count) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: Count,
  });
});


router.put("/update/:devisId", async (req, res) => {
  try {
    const { devisId } = req.params;
    const devis = await Devis.findById(devisId).populate("user");
    if (!devis) {
      return res.status(404).json({ error: "Devis not found" });
    }
    if (devis.converted) {
      return res
        .status(400)
        .json({ error: "Points already converted for this Devis" });
    }
    if (devis.status !== "Livraison") {
      return res.status(400).json({ error: "Devis is not in Livraison status" });
    }

    const montant = devis.montant;

    if (montant >= 150000) {
      totalPoint = Math.floor(montant * 0.02);
    } else {
      totalPoint = Math.floor(montant * 0.01);
    }
    devis.TotalPoint = totalPoint;
    devis.converted = true;

    const updatedDevis = await Devis.findById(devisId).populate("user");
    if (updatedDevis && updatedDevis.user && updatedDevis.user.email) {

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "applicationdeltacuisine@gmail.com",
          pass: "pphexfcjduvckjdv",
        },
      });

      const mailOptions = {
        from: "applicationdeltacuisine@gmail.com",
        to: updatedDevis.user.email,
        subject: "Devis Converted",
        html: `
        <html>
          <body>
            <p>Cher utilisateur,</p>
            <p>Votre commande (ID: ${updatedDevis.id}), d'un montant de ${updatedDevis.montant} DT, a été échangée contre ${updatedDevis.nombrepoint} points.</p>
             <p>Merci d'avoir utilisé notre service.</p>

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
    }

    await devis.save();
    const user = devis.user;

    user.TotalPoint += totalPoint;
    await user.save();

    return res.json(devis);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(`/`, async (req, res) => {
  try {
    const devisList = await Devis.find().populate("user");
    if (!devisList) {
      return res.status(500).json({ success: false });
    }
    res.status(200).send(devisList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(`/`, async (req, res) => {
  try {
    const user = await User.findById(req.body.user);
    if (!user) return res.status(400).send("Invalid user");

    let devis = new Devis({
      dateDevis: req.body.dateDevis,
      status: req.body.status,
      montant: req.body.montant,
      user: req.body.user,
      showroom: req.body.showroom,
      numDevis: req.body.numDevis,
      client: req.body.client,
      commercial: req.body.commercial,
      nombrepoint: req.body.montant * 0.01,
    });

    devis = await devis.save();
    if (!devis) {
      return res.status(500).send("The devis cannot be created");
    }
    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(`/:id`, async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id).populate("user");

    if (!devis) {
      return res.status(500).json({ success: false });
    }
    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/usersDevis/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const devisList = await Devis.find({ user: userId });
    if (!devisList) {
      return res.status(404).json({ error: "No devis found for the user" });
    }

    res.status(200).json(devisList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:userId/devis-status-count", async (req, res) => {
  try {
    const userId = req.params.userId;

    const allStatuses = [
      "Devis",
      "Commande",
      "Livraison",
    ];

    const userDevisStatusCounts = await Devis.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCountsMap = new Map();
    allStatuses.forEach((status) => {
      statusCountsMap.set(status, 0);
    });

    userDevisStatusCounts.forEach((entry) => {
      statusCountsMap.set(entry._id, entry.count);
    });

    const result = Array.from(statusCountsMap, ([statut, count]) => ({
      statut,
      count,
    }));

    res.json(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des données :", err);
    res.status(500).json({ error: "Une erreur est survenue" });
  }
});

router.get("/:status/:userId", async (req, res) => {
  const status = req.params.status;
  const userId = req.params.userId;
  try {
    const devisList = await Devis.find({ status: status, user: userId }).exec();
    res.json(devisList);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.delete("/:id", (req, res) => {
  Devis.findByIdAndRemove(req.params.id)
    .then((prod) => {
      if (prod) {
        return res
          .status(200)
          .json({ success: true, message: "the Devis is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "devis not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.put("/:id", async (req, res) => {
  try {
    const devis = await Devis.findByIdAndUpdate(
      req.params.id,
      {
        dateDevis: req.body.dateDevis,
        status: req.body.status,
        montant: req.body.montant,
        user: req.body.user,
        showroom: req.body.showroom,
        numDevis: req.body.numDevis,
        client: req.body.client,
      },
      { new: true }
    );

    if (!devis) return res.status(400).send("The devis cannot be updated!");

    const updatedDevis = await Devis.findById(req.params.id).populate("user");

    if (updatedDevis && updatedDevis.user && updatedDevis.user.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "applicationdeltacuisine@gmail.com",
          pass: "hrevysyictjcektz",
        },
      });

      const mailOptions = {
        from: "applicationdeltacuisine@gmail.com",
        to: updatedDevis.user.email,
        subject: "Devis Status Update",
        html: `
        <html>
          <body>
          <p>Cher utilisateur,</p>
          <p>Le statut de votre devis (ID du devis : ${updatedDevis.numDevis}) a été mis à jour à : ${req.body.status}</p>
          <p>Merci d'avoir utilisé notre service.</p>
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
    }

    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/test", async (req, res) => {
  try {
     const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "applicationdeltacuisine@gmail.com",
        pass: "pphexfcjduvckjdv",
      },
    });

     const mailOptions = {
      from: "applicationdeltacuisine@gmail.com",
      to: "yazid.firas@esprit.tn",
      subject: "Devis Status Update",
      text: "The status of your Devis has been updated.",
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
   } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
 

module.exports = router;
