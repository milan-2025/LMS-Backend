const mongoose = require("mongoose")

const leadSchema = new mongoose.Schema({
  shipper: {
    type: String,
    default: "",
  },
  contactPerson: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  timeZone: {
    type: String,
    default: "PST",
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  website: {
    type: String,
    default: "",
  },
  commodity: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  dateOfCall: Date,
  // followUp: Date,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    default: "new",
  },
  response: {
    type: String,
    default: "",
  },
  dnd: {
    type: Boolean,
    default: false,
  },
})

module.exports = mongoose.model("Lead", leadSchema)
