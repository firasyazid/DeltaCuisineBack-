const { Showrooms } = require("../models/showroom");
const express = require("express");
const router = express.Router();
const {Commercial} = require('../models/commercial');

router.post(`/`, async (req, res) => {
  const commercial = await Commercial.findById(req.body.commercial);
  if (!commercial) return res.status(400).send("Invalid Id");
const commercial2 = await Commercial.findById(req.body.commercial2);
  if (!commercial2) return res.status(400).send("Invalid Id");

    try {
   
      let devis = new Showrooms ({
        title: req.body.title,
         commercial: req.body.commercial,
         commercial2: req.body.commercial2,
      });
  
      devis = await devis.save();
      if (!devis) {
        return res.status(500).send('The showroom cannot be created');
      }
      res.send(devis);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  router.get(`/`, async (req, res) => {
    try {
      const devisList = await Showrooms.find().populate('commercial commercial2');
      if (!devisList) {
        return res.status(500).json({ success: false });
      }
      res.status(200).send(devisList);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  router.delete("/:id", (req, res) => {
    Showrooms.findByIdAndRemove(req.params.id)
      .then((prod) => {
        if (prod) {
          return res
            .status(200)
            .json({ success: true, message: "the showroom is deleted!" });
        } else {
          return res
            .status(404)
            .json({ success: false, message: "showroom not found!" });
        }
      })
      .catch((err) => {
        return res.status(500).json({ success: false, error: err });
      });
  });
  

  router.put("/:id", async (req, res) => {
    try {
   
      const devis = await Showrooms.findByIdAndUpdate(
        req.params.id,
        {
        title: req.body.title,
          name: req.body.name,
          numero: req.body.numero,
          commercial: req.body.commercial,
          commercial2: req.body.commercial2,
  
        },
        { new: true }
      );
  
      if (!devis) return res.status(400).send("The showroom cannot be updated!");
  
      res.send(devis);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });


  router.get(`/:id`, async (req, res) => {
    try {
      const devis = await Showrooms.findById(req.params.id).populate('commercial commercial2');
      if (!devis) {
        return res.status(500).json({ success: false });
      }
      res.send(devis);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get(`/get/count`, async (req, res) => {
    const userCount = await Showrooms.countDocuments();
    if (!userCount) {
      res.status(500).json({ success: false });
    }
    res.send({
      userCount: userCount,
    });
  });
  
  module.exports = router;
