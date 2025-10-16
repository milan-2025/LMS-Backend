const express = require("express")
const auth = require("../middlewares/auth")
const CallsDone = require("../models/CallsDone")
const FoundedEmail = require("../models/FoundedEmail")
const QuotesReceived = require("../models/QuotesReceived")
const LoadsCovered = require("../models/LoadsCovered")

const router = express.Router()

router.get("/get-general-report", auth, async (req, res) => {
  try {
    const today = new Date().getDay()

    let obj = {}

    for (let i = 0; i <= 6 - today; i++) {
      let dateRange = [
        new Date(Date.now() + 24 * i * 60 * 60 * 1000 - 12 * 60 * 60 * 1000),
        new Date(Date.now() + 24 * i * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      ]
      obj[today + i] = dateRange
    }

    let j = 0
    for (let i = today; i > 0; i--) {
      let dateRange = [
        new Date(Date.now() - 24 * i * 60 * 60 * 1000 - 12 * 60 * 60 * 1000),
        new Date(Date.now() - 24 * i * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      ]
      obj[j] = dateRange
      j++
    }
    let callsDoneObj = {}
    let emailsFoundObj = {}
    let quotesReceivedObj = {}
    let loadsCoveredObj = {}
    const days = Object.keys(obj)
    for (let i = 0; i < days.length; i++) {
      let calls = await CallsDone.find({
        addedBy: req.user._id,
        date: { $gt: obj[days[i]][0], $lt: obj[days[i]][1] },
      }).countDocuments()
      callsDoneObj[days[i]] = calls

      let emails = await FoundedEmail.find({
        addedBy: req.user._id,
        date: { $gt: obj[days[i]][0], $lt: obj[days[i]][1] },
      }).countDocuments()
      emailsFoundObj[days[i]] = emails

      let quotes = await QuotesReceived.find({
        addedBy: req.user._id,
        date: { $gt: obj[days[i]][0], $lt: obj[days[i]][1] },
      }).countDocuments()

      quotesReceivedObj[days[i]] = quotes

      let loads = await LoadsCovered.find({
        addedBy: req.user._id,
        date: { $gt: obj[days[i]][0], $lt: obj[days[i]][1] },
      }).countDocuments()
      loadsCoveredObj[days[i]] = loads
    }
    // const CallsDone = CallsDone.find({})
    return res.status(200).json({
      callsDoneObj,
      emailsFoundObj,
      quotesReceivedObj,
      loadsCoveredObj,
      today,
    })
  } catch (e) {
    console.log("error---", e)
    return res.status(400).json({
      error: e.message || "error while getting report data.",
    })
  }
})

module.exports = router
