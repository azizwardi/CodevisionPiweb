const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    projectName: {
        type: String,
        required: true
    },
    projectDesc: {
        type: String,
        required: true
    },
    projectCategory: {
        type: String,
        required: true
    },
    projectStartDate: {
        type: Date,
        required: true
    },
    projectEndDate: {
        type: Date,
        required: true
    },
    project_admins_ids : {
        type : [Schema.Types.ObjectId],
        default : []
    },
    project_owners_ids : {
        type : [Schema.Types.ObjectId],
        default : []
    },
    project_users_ids : {
        type : [Schema.Types.ObjectId],
        default : []
    }
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;