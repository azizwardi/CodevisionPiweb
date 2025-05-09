const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const skillSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: { 
    type: String 
  },
  category: { 
    type: String,
    enum: ["technical", "soft", "domain", "other"],
    default: "technical"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Skill = mongoose.model("Skill", skillSchema);
module.exports = Skill;
