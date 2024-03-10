const mongoose = require("mongoose");

const devisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  dateDevis: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Devis", "Commande", "Livraison"],
    default: "Devis",
  },
  montant: {
    type: Number,
    default: 0,
  },
  converted: {
    type: Boolean,
    default: false,
  },
  showroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Showrooms",
    default: null,
  },
  numDevis: {
    type: String,
    default: "",
  },
  client: {
    type: String,
    default: "",
  },
  nombrepoint: {
    type: Number,
    default: 0,
  },
  commercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commercial",
    default: null,
  },
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Commande",
    default: null,
  },
  livraison: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Livraison",
    default: null,
  },
  commercialnom: {
    type: String,
    default: "",
    get: function () {
      if (this.commercial && this.commercial.fullName) {
        return this.commercial.fullName;
      }
      return this.commercialnom;
    },
  },

});

devisSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

devisSchema.set("toJSON", {
  virtuals: true,
});

exports.Devis = mongoose.model("Devis", devisSchema);
exports.devisSchema = devisSchema;
