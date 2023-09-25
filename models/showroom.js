const mongoose = require('mongoose');


const showroomSchema = new mongoose.Schema({

title :{ 
 type:String
},
name : { 
    type:String
}, 
numero : { 
    type:String
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
