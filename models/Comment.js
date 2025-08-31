const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
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

module.exports = mongoose.model("Comment", commentSchema)
