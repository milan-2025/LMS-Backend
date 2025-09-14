const mongoose = require("mongoose")

const emailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
  },
})

module.exports = mongoose.model("Email", emailSchema)
