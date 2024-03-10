const mongoose = require("mongoose");

const produitsSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  contenu: {
    type: String,
  },
  image: {
    type: String,
  },
  video: {
    type: String,
    default: "",
  },

  image1: {
    type: String,
    default: "",
  },

  image2: {
    type: String,
    default: "",
  },

  image3: {
    type: String,
    default: "",
  },
});

produitsSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

produitsSchema.set("toJSON", {
  virtuals: true,
});

exports.Produits = mongoose.model("Produits", produitsSchema);
exports.produitsSchema = produitsSchema;
