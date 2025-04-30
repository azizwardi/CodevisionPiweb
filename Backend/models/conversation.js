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
    default: "Nouvelle conversation" 
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

// Mettre à jour le timestamp updatedAt avant de sauvegarder
conversationSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
