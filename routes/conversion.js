const express = require('express');
const router = express.Router();
const {DevisConversion} = require('../models/DevisConversion');

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


  router.get('/', async (req, res) => {
    try {
        const conv = await DevisConversion.find();

        if (!conv) {
            return res.status(500).json({ success: false });
        }

        res.status(200).send(conv);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.delete("/:id", (req, res) => {
  DevisConversion.findByIdAndRemove(req.params.id)
    .then((prod) => {
      if (prod) {
        return res
          .status(200)
          .json({ success: true, message: "the DevisConversion is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "DevisConversion not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});


router.put("/:id", async (req, res) => {
  try {
    const devis = await DevisConversion.findByIdAndUpdate(
      req.params.id,
      {
        conversionRate: req.body.conversionRate,
       },
      { new: true }
    );

    if (!devis) return res.status(400).send("The rate cannot be updated!");
    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
