const { Devis } = require("../models/devis");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const {Commande} = require("../models/commande");
const {Livraison} = require("../models/livraison"); 


router.get(`/`, async (req, res) => {
    try {
      const devisList = await Livraison.find().populate("commande user devis").sort({ _id: -1 });
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
      const livraison = await Livraison.findByIdAndUpdate(
        req.params.id,
        {
          dateLivraison: req.body.dateLivraison,
           numLivraison: req.body.numLivraison,
            montantLivraison: req.body.montantLivraison,
           
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



  router.get("/:id", async (req, res) => {
    const user = await Livraison.findById(req.params.id);
  
    if (!user) {
      res
        .status(500)
        .json({ message: "The user with the given ID was not found." });
    }
    res.status(200).send(user);
  });



  router.delete("/:id", (req, res) => {
    Livraison.findByIdAndRemove(req.params.id)
      .then((user) => {
        if (user) {
          return res
            .status(200)
            .json({ success: true, message: "the livraison is deleted!" });
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




  router.get("/getLiv/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const commands = await Livraison.find({ user: userId }).populate("devis commande")
      res.json(commands);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
   module.exports = router;