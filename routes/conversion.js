const express = require('express');
const router = express.Router();
const DevisConversion = require('../models/DevisConversion');

router.post(`/`, async (req, res) => {
    try {
   
      let devis = new DevisConversion ({
        conversionRate: req.body.conversionRate,
      });

      devis = await devis.save();
      if (!devis) {
            return res.status(500).send('The Devis Conversion cannot be created');
      }
      res.send(devis);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


router.get(`/`, async (req, res) => {
  const List = await DevisConversion.find();

  if (!List) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(List);
});

 
module.exports = router;
