const mongoose = require('mongoose');

const userPushTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true,
    unique: true,  
  },
  expoPushToken: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const UserPushToken = mongoose.model('UserPushToken', userPushTokenSchema);

module.exports = UserPushToken;
