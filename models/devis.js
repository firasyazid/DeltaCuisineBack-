const mongoose = require('mongoose');


const devisSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateDevis: {
        type: Date,
     },
     status: {
        type: String,
         default: 'Pending',
    },
    montant : {
        type: Number,
        default:0
    },
    TotalPoint: {
        type: Number,
        default: 0,
     },
     converted: { 
        type:Boolean, 
        default:false,
     }


});


devisSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

devisSchema.set('toJSON', {
    virtuals: true,
});

exports.Devis = mongoose.model('Devis', devisSchema);
exports.devisSchema = devisSchema;
