const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamChatMessageSchema = new Schema({
  team: { 
    type: Schema.Types.ObjectId, 
    ref: "Team", 
    required: true 
  },
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  readBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  }]
});

const TeamChatMessage = mongoose.model("TeamChatMessage", teamChatMessageSchema);
module.exports = TeamChatMessage;
