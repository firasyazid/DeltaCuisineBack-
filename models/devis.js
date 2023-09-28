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
        enum: ['Devis', 'Commande', 'Clôturé'],
        default: 'En cours de traitement'
      },
    montant : {
        type: Number,
        default:0
    },
      converted: { 
        type:Boolean, 
        default:false,
     },
     showroom: {    
        type: String,   
        default: '',
     },
     numDevis: {
        type: String,
        default: '',
     },
     client:{ 
        type: String,   
        default: '',
     },
     nombrepoint:{ 
        type: Number,  
        default:0
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
