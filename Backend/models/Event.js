const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
    },
    allDay: {
      type: Boolean,
      default: true,
    },
    calendar: {
      type: String,
      enum: ["Danger", "Success", "Primary", "Warning"],
      default: "Primary",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
