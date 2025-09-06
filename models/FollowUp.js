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
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
    unique: true,
  },
})

module.exports = mongoose.model("FollowUp", followUpSchema)
