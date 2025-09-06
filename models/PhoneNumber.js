const mongoose = require("mongoose")

const phoneNumberSchema = new mongoose.Schema({
  phoneNumber: {
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

module.exports = mongoose.model("PhoneNumber", phoneNumberSchema)
