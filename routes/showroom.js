const { Showrooms } = require("../models/showroom");
const express = require("express");
const router = express.Router();
const {Commercial} = require('../models/commercial');
const { Expo } = require('expo-server-sdk');  
const UserPushToken = require('../models/userPushTokenSchema');  
let expo = new Expo();  


  
router.post(`/`, async (req, res) => {
  // Validate commercial IDs
  const commercial = await Commercial.findById(req.body.commercial);
  if (!commercial) return res.status(400).send("Invalid Commercial Id");

  const commercial2 = await Commercial.findById(req.body.commercial2);
  if (!commercial2) return res.status(400).send("Invalid Commercial2 Id");

  try {
    // Create the new showroom
    let devis = new Showrooms({
      title: req.body.title,
      commercial: req.body.commercial,
      commercial2: req.body.commercial2,
    });

    devis = await devis.save();
    if (!devis) {
      return res.status(500).send('The showroom cannot be created');
    }

    // Step 1: Retrieve all Expo push tokens
    const tokens = await UserPushToken.find().select('expoPushToken');

    if (tokens && tokens.length > 0) {
      let messages = [];

      // Step 2: Create notification messages for each token
      for (let tokenDoc of tokens) {
        const expoPushToken = tokenDoc.expoPushToken;
        if (Expo.isExpoPushToken(expoPushToken)) {
          messages.push({
            to: expoPushToken,
            sound: 'default',
            title: 'Nouveau Showroom !',
            body: `Nouveau Showroom "${devis.title}".`,
            data: { showroomId: devis._id },
          });
        }
      }

      // Step 3: Chunk and send notifications
      let chunks = expo.chunkPushNotifications(messages);
      let tickets = [];
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notifications:', error);
        }
      }
    }

    // Send the response with the new showroom data
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
