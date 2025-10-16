const mongoose = require("mongoose")

const callsDoneSchema = new mongoose.Schema({
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

module.exports = mongoose.model("CallsDone", callsDoneSchema)
