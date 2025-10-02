const mongoose = require("mongoose")

const hotLeadSchema = new mongoose.Schema({
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

module.exports = mongoose.model("HotLead", hotLeadSchema)
