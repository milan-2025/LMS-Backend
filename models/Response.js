const mongoose = require("mongoose")

const responseSchema = new mongoose.Schema({
  response: {
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

module.exports = mongoose.model("Response", responseSchema)
