const mongoose = require("mongoose");

const livraisonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
 
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commande",
    default: null,
  },  

  devis : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devis",
    default: null,
  },
  dateLivraison: {
    type: Date,
    default: null,
  },
  montantLivraison: {
    type: Number,
    default: 0,
  },
  numLivraison: {
    type: String,
    default: "",
  },
 
});

livraisonSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

livraisonSchema.set("toJSON", {
  virtuals: true,
});

exports.Livraison = mongoose.model("Livraison", livraisonSchema);
exports.livraisonSchema = livraisonSchema;
