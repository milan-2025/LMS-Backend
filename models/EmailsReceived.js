const mongoose = require("mongoose")

const emailsReceivedSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  addedBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  leadId: {
    type: mongoose.Types.ObjectId,
    ref: "Lead",
    required: true,
  },
})

module.exports = mongoose.model("EmailsReceived", emailsReceivedSchema)
