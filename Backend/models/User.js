const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    username: { 
        type: String, 
        required: true 
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    role: { 
        type: String, enum: ["admin", "TeamLeader", "member", "user"],
        default: "user" 
    },
    phoneNumber: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    verificationTokenExpires: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;

