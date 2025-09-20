const express = require("express")
const router = express.Router()

const auth = require("../middlewares/auth")
const FollowUp = require("../models/FollowUp")
const Lead = require("../models/Lead")
const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const timezone = require("dayjs/plugin/timezone")

dayjs.extend(utc)
dayjs.extend(timezone)

router.post("/add-follow-up", auth, async (req, res, next) => {
  const { date, leadId, timeZone } = req.body
  try {
    let savedFollowUP = null
    const existingFollowUp = await FollowUp.find({ lead: leadId })
    if (existingFollowUp.length > 0) {
      existingFollowUp[0].date = new Date(date)
      // existingFollowUp[0].timeZone = timeZone

      savedFollowUP = await existingFollowUp[0].save()
      if (!savedFollowUP) {
        let error = new Error("Error while saving follow up")
        throw error
      }
      return res.status(201).json({ message: "Follow up set successfully." })
    }

    const followUp = new FollowUp({
      date: new Date(date),
      lead: leadId,
      timeZone: timeZone.toUpperCase(),
      addedBy: req.user._id,
    })
    savedFollowUP = await followUp.save()
    if (!savedFollowUP) {
      let error = new Error("Error while saving follow up")
      throw error
    }
    return res.status(201).json({ message: "Follow up set successfully." })
  } catch (e) {
    console.log("err", e)
    return res.status(400).json({ error: "Error while adding follow up." })
  }
})

router.get("/get-follow-up", auth, async (req, res, next) => {
  const timezones = [
    { name: "PST", id: "America/Los_Angeles" },
    { name: "MST", id: "America/Denver" },
    { name: "CST", id: "America/Chicago" },
    { name: "EST", id: "America/New_York" },
  ]
  try {
    let nowDate = null
    const dueTimezoneConditions = timezones.map((tzone) => {
      // let now = new Date()
      // let dateString = now.toLocaleString("en-US", {
      //   timeZone: tzone.id,
      // })
      // let nowDate = new Date(dateString)
      // console.log("date in bk", nowDate)

      nowDate = dayjs().tz(tzone.id)
      // console.log("nd ", nowDate.toDate())

      // let nowDate =
      // console.log("bkdate", nowDate)
      return {
        timeZone: tzone.name,
        date: { $lte: nowDate.toDate() },
      }
    })

    const query = {
      $and: [{ addedBy: req.user._id }, { $or: dueTimezoneConditions }],
    }
    const page = parseInt(req.query.page) || 1 // Default to page 1
    const limit = 5 // Default to 10 items per page

    const skip = (page - 1) * limit
    const totalItems = await FollowUp.find(query).countDocuments()
    const totalPages = Math.ceil(totalItems / limit)

    const pendingFollowUps = await FollowUp.find(query)
      .sort({
        date: 1,
      })
      .skip(skip)
      .limit(limit)
      .populate("lead")
      .exec()

    return res
      .status(200)
      .json({ pendingFollowUps, page, limit, totalPages, totalItems })
  } catch (e) {
    console.log("err, ", e)
    return res
      .status(400)
      .json({ error: "error while gettin follow ups in backend" })
  }
  // we will check that if date in follow up is lte to the current date and time in the same time zone
})

router.get("/get-follow-up-ids", auth, async (req, res, next) => {
  const timezones = [
    { name: "PST", id: "America/Los_Angeles" },
    { name: "MST", id: "America/Denver" },
    { name: "CST", id: "America/Chicago" },
    { name: "EST", id: "America/New_York" },
  ]
  try {
    let nowDate = null
    const dueTimezoneConditions = timezones.map((tzone) => {
      // let now = new Date()
      // let dateString = now.toLocaleString("en-US", {
      //   timeZone: tzone.id,
      // })
      // let nowDate = new Date(dateString)
      nowDate = dayjs().tz(tzone.id)
      // console.log("nd ", nowDate.toDate())
      return {
        timeZone: tzone.name,
        date: { $lte: nowDate.toDate() },
      }
    })

    const query = {
      $and: [{ addedBy: req.user._id }, { $or: dueTimezoneConditions }],
    }
    const ids = await FollowUp.find(query).select("lead")
    // const ids = await FollowUp.find(query, { _id: 1 })
    return res.status(200).json({
      ids,
    })
  } catch (e) {
    return res
      .status(400)
      .json({ error: "error while getting top follow up id." })
  }
})

module.exports = router
