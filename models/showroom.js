const mongoose = require('mongoose');


const showroomSchema = new mongoose.Schema({
title :{ 
 type:String
},
commercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commercial'
  },
  commercial2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commercial'
  },

});

showroomSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

showroomSchema.set('toJSON', {
    virtuals: true,
});

exports.Showrooms = mongoose.model('Showrooms', showroomSchema);
exports.showroomSchema = showroomSchema;
