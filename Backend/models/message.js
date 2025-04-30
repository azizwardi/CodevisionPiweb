const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversation: { 
    type: Schema.Types.ObjectId, 
    ref: "Conversation", 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["user", "assistant"], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  task: { 
    type: Schema.Types.ObjectId, 
    ref: "Task" 
  }
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
