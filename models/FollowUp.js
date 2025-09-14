const mongoose = require("mongoose")

const followUpSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  timeZone: {
    type: String,
    required: true,
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
    unique: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
})

module.exports = mongoose.model("FollowUp", followUpSchema)
