const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        default: null,
    },

    phone: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,   
        default:false
    },
    fonction: {
        type: String,
        default: ''
    },

    cin: {
        type: String,
        default: ''
    },
    patente: {
        type: String,
        default: ''
    },
    
    validation: {
        type: Boolean,
        default: false
      },

      TotalPoint: {
        type: Number,
        default: 0,
     },
    
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
