const { Devis } = require("../models/devis");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { Commande } = require("../models/commande");
const { Livraison } = require("../models/livraison");

router.get(`/`, async (req, res) => {
  try {
    const devisList = await Commande.find()
      .populate("devis user showroom")
      .sort({ _id: -1 });
    if (!devisList) {
      return res.status(500).json({ success: false });
    }
    res.status(200).send(devisList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const cmd = await Commande.findByIdAndUpdate(
      req.params.id,
      {
        dateCmd: req.body.dateCmd,
        montantCmd: req.body.montantCmd,
        numCmd: req.body.numCmd,
      },
      { new: true }
    );

    if (!cmd) return res.status(400).send("The Commande cannot be updated!");
    res.send(cmd);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", (req, res) => {
  Commande.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the command is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "command not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get("/:id", async (req, res) => {
  const cmd = await Commande.findById(req.params.id).populate("devis user showroom")
  .sort({ _id: -1 });


  if (!cmd) {
    res
      .status(500)
      .json({ message: "The commande with the given ID was not found." });
  }
  res.status(200).send(cmd);
});



router.get("/getcmd/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const commands = await Commande.find({ user: userId }).populate("devis user showroom")
    res.json(commands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
