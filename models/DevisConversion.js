const mongoose = require('mongoose');

const ConversionSchema = new mongoose.Schema({
    conversionRate: {
        type: Number,
        required: true,
    },
 });

 ConversionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
ConversionSchema.set('toJSON', {
    virtuals: true,
});

exports.DevisConversion = mongoose.model('DevisConversion', ConversionSchema);
exports.ConversionSchema = ConversionSchema;


 