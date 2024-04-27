const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
 

  message: {
    type: String,
  },
  document : { 
    type:String,
    default : '',
  },
  devis : {
    type:String,
    default : '',
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
   client:{ 
        type: String,   
        default: '',
     },
});

contactSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

contactSchema.set("toJSON", {
  virtuals: true,
});

exports.Contact = mongoose.model("Contact", contactSchema);
exports.contactSchema = contactSchema;
