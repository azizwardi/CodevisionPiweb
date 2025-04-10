const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectCommentSchema = new Schema({
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    } ,
    commentText : {
        type : String
    } ,
    projectId : {
        type : Schema.Types.ObjectId ,
        ref : 'Project'
    }
}, { timestamps: true });

const ProjectComment = mongoose.model('ProjectComment', ProjectCommentSchema);
module.exports = ProjectComment;