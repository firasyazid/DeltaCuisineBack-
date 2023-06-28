const {Devis} = require('../models/devis');
const express = require('express');
const router = express.Router();
const {User} = require('../models/user');
 

router.put('/update/:devisId', async (req, res) => {
  try {
    const { devisId } = req.params;

    const devis = await Devis.findById(devisId).populate('user');

    if (!devis) {
      return res.status(404).json({ error: 'Devis not found' });
    }

    if (devis.converted) {
      return res.status(400).json({ error: 'Points already converted for this Devis' });
    }

    const montant = devis.montant;
    const totalPoint = Math.floor(montant * 0.1);

    devis.TotalPoint = totalPoint;
    devis.converted = true;
    await devis.save();

    const user = devis.user;

    user.TotalPoint += totalPoint;
    await user.save();

    return res.json(devis);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get(`/`, async (req, res) => {
  try {
    const devisList = await Devis.find().populate('user');
    if (!devisList) {
      return res.status(500).json({ success: false });
    }
    res.status(200).send(devisList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post(`/`, async (req, res) => {
  try {
    const user = await User.findById(req.body.user);
    if (!user) return res.status(400).send('Invalid user');

    let devis = new Devis({
      dateDevis: req.body.dateDevis,
      status: req.body.status,
      montant: req.body.montant,
      user: req.body.user,
    });

    devis = await devis.save();
    if (!devis) {
      return res.status(500).send('The devis cannot be created');
    }

    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get(`/:id`, async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id).populate('user');

    if (!devis) {
      return res.status(500).json({ success: false });
    }
    res.send(devis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports =router;