const mongoose = require('mongoose');

const devisConversionSchema = new mongoose.Schema({
    conversionRate: {
        type: Number,
        required: true,
    },
 });

 devisConversionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
devisConversionSchema.set('toJSON', {
    virtuals: true,
});

exports.Devis = mongoose.model('DevisConversion', devisConversionSchema);
exports.devisConversionSchema = devisConversionSchema;
