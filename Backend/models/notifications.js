const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId : {
        type : Schema.Types.ObjectId
    } ,
    notificationText : {
        type : String
    } ,
    isViewedBy : {
        type : Boolean,
        default : false
    }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;