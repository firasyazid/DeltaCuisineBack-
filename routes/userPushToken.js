const express = require('express');
const router = express.Router();
 const { Expo } = require('expo-server-sdk');  
const UserPushToken = require('../models/userPushTokenSchema');  
let expo = new Expo();  
// Endpoint to save or update the user's Expo push token
router.post('/save-push-token', async (req, res) => {
  const { userId, expoPushToken } = req.body;

  try {
    // Validate the incoming request
    if (!userId || !expoPushToken) {
      return res.status(400).json({ message: 'UserId and ExpoPushToken are required.' });
    }

    // Find if there's an existing token for this user
    let existingToken = await UserPushToken.findOne({ userId });

    if (existingToken) {
      // If an entry exists, update the token and lastUpdated field
      existingToken.expoPushToken = expoPushToken;
      existingToken.lastUpdated = Date.now();
      await existingToken.save();
    } else {
      // If there's no existing entry, create a new document
      const newToken = new UserPushToken({
        userId,
        expoPushToken,
      });
      await newToken.save();
    }

    // Respond with success
    res.status(200).json({ message: 'Push token saved successfully.' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/push-token/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const token = await UserPushToken.findOne({ userId });
  
      if (!token) {
        return res.status(404).json({ message: 'Push token not found for the given user ID.' });
      }
  
      res.status(200).json(token);
    } catch (error) {
      console.error('Error fetching push token:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  router.get('/push-tokens', async (req, res) => {
    try {
      // Retrieve all user push tokens
      const tokens = await UserPushToken.find();
      res.status(200).json(tokens);
    } catch (error) {
      console.error('Error fetching push tokens:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  router.post('/send-custom-notification', async (req, res) => {
    try {
      const { title, message } = req.body;
  
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }
  
      // Retrieve all Expo push tokens from the UserPushToken collection
      const allTokens = await UserPushToken.find().select('expoPushToken');
  
      if (!allTokens || allTokens.length === 0) {
        return res.status(404).json({ error: "No users with valid push tokens found" });
      }
  
      // Prepare messages to send to all tokens
      const messages = allTokens.map(tokenDoc => {
        const expoPushToken = tokenDoc.expoPushToken;
        if (Expo.isExpoPushToken(expoPushToken)) {
          return {
            to: expoPushToken,
            sound: 'default',
            title: title,
            body: message,
            data: { customMessage: message },
          };
        }
      }).filter(Boolean);  
  
       const chunks = expo.chunkPushNotifications(messages);
      let tickets = [];
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending notification chunk:", error);
        }
      }
  
      return res.status(200).json({
        message: "Custom notification sent successfully",
        tickets: tickets
      });
    } catch (error) {
      console.error("Error sending custom notification:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  



module.exports = router;
