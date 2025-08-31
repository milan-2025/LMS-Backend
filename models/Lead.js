const mongoose = require("mongoose")

const leadSchema = new mongoose.Schema({
  shipper: {
    type: String,
  },
  contactPerson: {
    type: String,
  },
  address: String,
  state: String,
  timeZone: String,
  phoneNumber: String,
  website: String,
  commodity: String,
  email: String,
  dateOfCall: Date,
  followUp: Date,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
})

module.exports = mongoose.model("Lead", leadSchema)
