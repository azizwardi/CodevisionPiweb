const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project"
  },
  title: {
    type: String,
    default: "New conversation"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
conversationSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
