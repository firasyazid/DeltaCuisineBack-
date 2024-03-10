

const mongoose = require('mongoose');

const commercialSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  Phone: {
    type: String,
    required: true
  },
  
 
});

commercialSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

commercialSchema.set('toJSON', {
    virtuals: true,
});

exports.Commercial = mongoose.model('Commercial', commercialSchema);
exports.commercialSchema = commercialSchema;
