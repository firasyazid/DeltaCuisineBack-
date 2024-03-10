const mongoose = require('mongoose');


const articleSchema = new mongoose.Schema({

title :{ 
 type:String
},
description : { 
    type:String
}, 
contenu : { 
    type:String
}, 
image: { 
    type:String
},
video : { 
    type:String,
    default: ""
},
image1 : 
{
    type: String,
    default:''
},
image2 : 
{
    type: String,
    default:''
},

image3 : 
{
    type: String,
    default:''
},  

 

});

articleSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

articleSchema.set('toJSON', {
    virtuals: true,
});

exports.Articles = mongoose.model('Articles', articleSchema);
exports.articleSchema = articleSchema;
