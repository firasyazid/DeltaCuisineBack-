

 
const express = require("express");
const router = express.Router();
const {Commercial} = require('../models/commercial');
  

router.post(`/`, async (req, res) => {
    try {
  
      let commercial = new Commercial ({
        fullName: req.body.fullName,
        Phone: req.body.Phone,
        });
  
      commercial = await commercial.save();
      if (!commercial) {
        return res.status(500).send('The commercial cannot be created');
      }
      res.send(commercial);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });



    router.get(`/`, async (req, res) => {
    try {
      const commercialList = await Commercial.find();
      if (!commercialList) {
        return res.status(500).json({ success: false });
      }
      res.status(200).send(commercialList);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }   
    }
    );



    router.delete("/:id", (req, res) => {

        Commercial.findByIdAndRemove(req.params.id)
          .then((prod) => {
            if (prod) {
              return res
                .status(200)
                .json({ success: true, message: "the commercial is deleted!" });
            } else {
              return res
                .status(404)
                .json({ success: false, message: "commercial not found!" });
            }
          })
          .catch((err) => {
            return res.status(500).json({ success: false, error: err });
          });
      }
        );



        //// put router 



router.put("/:id", async (req, res) => {
    try {
   
      const devis = await Commercial.findByIdAndUpdate(
        req.params.id,
        {

            fullName: req.body.fullName,
            Phone:req.body.Phone
    
        },
        { new: true }
      );
  
      if (!devis) return res.status(400).send("The commercial cannot be updated!");
  
      res.send(devis);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  router.get("/:id", async (req, res) => {
    const com = await Commercial.findById(req.params.id);
    if (!com) {
      res
        .status(500)
        .json({ message: "The commercial with the given ID was not found." });
    }
    res.status(200).send(com);
  });


  router.get("/name/:id", async (req, res) => {
    try {
      const com = await Commercial.findById(req.params.id);
      if (!com) {
        return res.status(404).json({ message: "The commercial with the given ID was not found." });
      }
      res.status(200).json({ fullName: com.fullName });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  
module.exports = router;