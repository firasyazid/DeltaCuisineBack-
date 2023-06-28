const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
  },

  sujet: {
    type: String,
  },
  message: {
    type: String,
  },

  document : { 

    type:String,
    default : '',
  }
});

contactSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

contactSchema.set("toJSON", {
  virtuals: true,
});

exports.Contact = mongoose.model("Contact", contactSchema);
exports.contactSchema = contactSchema;
