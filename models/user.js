const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    username: {
        type: String, 
        unique: true, 
        required: true
    },
    firstName: String,
    lastName: String,
    avatar: String,
    admincode: String,
    resetPasswordToken: String,
    resetPasswordExpires: String,
    isAdmin: {
        type: Boolean,
         default: false
    },
    email: {
        type: String,
        unique: true,
        required: true
    }
});
// Passport local automatically adds a static method called 'authenticate()'

// This will automatically add in a username and password (hash and salt) field to our schema
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);