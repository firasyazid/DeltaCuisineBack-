const mongoose = require("mongoose");

const commandeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  devis : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devis",
  },
  dateCmd: {
    type: Date,
    default: null ,
},
 
  montantCmd: {
    type: Number,
    default: 0,
    },
  numCmd: {
    type: String,
    default: "",
  },
  showroom: {
    type:mongoose.Schema.Types.ObjectId,
    ref: "Showrooms",
   },  
   NumDevis: {
    type: String,
    required: true
  },
 
   
});

commandeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

commandeSchema.set("toJSON", {
  virtuals: true,
});

exports.Commande = mongoose.model("Commande", commandeSchema);
exports.commandeSchema = commandeSchema;
