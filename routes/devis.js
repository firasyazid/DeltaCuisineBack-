const { Devis } = require("../models/devis");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { Commande } = require("../models/commande");
const { Livraison } = require("../models/livraison");
const { Showrooms } = require("../models/showroom");
const { Commercial } = require("../models/commercial");


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
    const devis = await Devis.findById(devisId).populate("user commande");
    if (!devis) {
      return res.status(404).json({ error: "Devis not found" });
    }
    if (devis.converted) {
      return res.status(400).json({ error: "Points already converted for this Devis" });
    }
    if (devis.status !== "Commande") {
      return res.status(400).json({ error: "Devis is not in Commande status" });
    }
    
    const montant = devis.commande.montantCmd;

    let totalPoint;
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
              <p>Votre commande (ID: ${updatedDevis.id}), d'un montant de ${montant} DT, a été échangée contre ${totalPoint} points.</p>
              <p>Merci d'avoir utilisé notre service.</p>
            </body>
          </html>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.status(500).json({ error: "Error sending email" });
        } else {
          console.log("Email sent:", info.response);
          return res.status(200).json({ message: "Email sent successfully", devis });
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
    const devisList = await Devis.find().populate("user commande showroom commercial").sort({ _id: -1 });;
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
 

    const commercialId = req.body.commercial;
    const commercial = await Commercial.findById(commercialId);
    if (!commercial) return res.status(400).send("Invalid commercial");

    const showroomId = req.body.showroom;
    const showroom = await Showrooms.findById(showroomId);
    if (!showroom) return res.status(400).send("Invalid showroom");

    let devis = new Devis({
      dateDevis: req.body.dateDevis,
      status: req.body.status,
      montant: req.body.montant,
      user: req.body.user,
      showroom: req.body.showroom,
      numDevis: req.body.numDevis,
      client: req.body.client,
      commercial: req.body.commercial,
      commercialnom: commercial.fullName, 
      nombrepoint: req.body.montant * 0.01,
    });

    devis = await devis.save();
    if (!devis) {
      return res.status(500).send("The devis cannot be created");
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
      to: user.email,
      subject: "Nouveau Devis ajouté",
      html: `
        <html>
          <body>
            <p>Cher(e) partenaire,</p>
            <p>Nous tenons à vous informer que le statut de votre devis (Numéro de devis: ${devis.numDevis}) a été ajouté avec succès.</p>

            <p>Montant du devis: ${devis.montant}</p>
            <p>Dans l'attente de pouvoir convertir ce devis en commande, notre équipe est à votre disposition pour répondre à toutes vos questions et faciliter le processus.</p>

             <p>Nous sommes impatients de poursuivre cette collaboration fructueuse.</p>
              <p>L'équipe Delta Cuisine.</p>
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
    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(`/:id`, async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id).populate("user commande showroom commercial");
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
    const devisList = await Devis.find({ user: userId }).populate("user commande showroom commercial");
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
    const allStatuses = ["Devis", "Commande", "Livraison"];
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

    // Calculate total count of all devis
    const totalCount = userDevisStatusCounts.reduce((acc, entry) => acc + entry.count, 0);
    statusCountsMap.set("All Devis", totalCount);

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






/////this convert devis to commande to livraison
router.put("/:id", async (req, res) => {
  const devis = await Devis.findById(req.params.id);

  if (!devis) return res.status(400).send("The devis cannot be found!");

  const oldStatus = devis.status;

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
        commercial: req.body.commercial,
      },
      { new: true }
    );

    if (!devis) return res.status(400).send("The devis cannot be updated!");
    
    if (req.body.status === "Commande") {
      const newCommande = new Commande({
         devis: devis,
         montantCmd: devis.montant,
         user: devis.user,
        showroom: devis.showroom,
        NumDevis: devis.numDevis,
        
      });
    await newCommande.save();
    devis.commande = newCommande._id;
    await devis.save();
      }



      if (req.body.status === "Livraison" && (devis.commande === undefined || devis.commande === null)  ) {
        return res.status(400).send("Le devis doit avoir une commande pour être mis à jour en Livraison !");
      }
      
      if (req.body.status === "Livraison" && (devis.commande !== undefined && devis.commande !== null && oldStatus !== "Commande") ){
        const commande = await Commande.findById(devis.commande);
      if (!commande) return res.status(400).send("The command cannot be found!");


      const newLivraison = new Livraison({
        devis: devis,
        commande: devis.commande,
        montantLivraison: commande.montantCmd,
        user: commande.user,
       });
      await newLivraison.save();
      devis.livraison = newLivraison._id;
      await devis.save();
    }

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












 

///// put routerr commande

router.put("/commande/:id", async (req, res) => {
  try {
    const commande = await Commande.findByIdAndUpdate(
      req.params.id,
      {
        user: req.body.user,
        dateCmd: req.body.dateCmd,
        montantCmd: req.body.montantCmd,
        showroom: req.body.showroom,
        numCmd: req.body.numCmd,
        client: req.body.client,
        commercial: req.body.commercial,
      },
      { new: true }
    );

    if (!commande)
      return res.status(400).send("The commande cannot be updated!");

    // Récupérer le devis associé à la commande
    const devis = await Devis.findOneAndUpdate(
      { _id: commande.devis },
      { numCmd: req.body.numCmd },
      { new: true }
    );

    if (!devis) return res.status(400).send("The devis cannot be updated!");

    res.send({ commande, devis });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


/// put livraison

router.put("/:id", async (req, res) => {
  try {
    const livraison = await Livraison.findByIdAndUpdate(
      req.params.id,
      {
        dateLivraison: req.body.dateLivraison,
        status: req.body.status,
        showroom: req.body.showroom,
        numLivraison: req.body.numLivraison,
        client: req.body.client,
        commercial: req.body.commercial,
      },
      { new: true }
    );

    if (!livraison)
      return res.status(400).send("The livraison cannot be updated!");

    res.send(livraison);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/// get devis livraison

router.get(`/liv`, async (req, res) => {
  try {
    const devisList = await Livraison.find().populate("user");
    if (!devisList) {
      return res.status(500).json({ success: false });
    }
    res.status(200).send(devisList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
