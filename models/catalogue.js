const mongoose = require('mongoose');


const catalogueSchema = new mongoose.Schema({
    catalogue: {
      type: String,
      default:''
    },
})







catalogueSchema.virtual("id").get(function () {
    return this._id.toHexString();
  });
  
  catalogueSchema.set("toJSON", {
    virtuals: true,
  });
  
  exports.Catalogue = mongoose.model("Catalogue", catalogueSchema);
  exports.catalogueSchema = catalogueSchema;
  