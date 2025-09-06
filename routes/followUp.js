const express = require("express")
const router = express.Router()

const auth = require("../middlewares/auth")
const FollowUp = require("../models/FollowUp")

router.post("/add-follow-up", auth, async (req, res, next) => {
  const { date, leadId, timeZone } = req.body
  try {
    let savedFollowUP = null
    const existingFollowUp = await FollowUp.find({ leadId: leadId })
    if (existingFollowUp.length > 0) {
      existingFollowUp[0].date = date
      existingFollowUp[0].timeZone = timeZone

      savedFollowUP = await existingFollowUp[0].save()
      if (!savedFollowUP) {
        let error = new Error("Error while saving follow up")
        throw error
      }
      return res.status(201).json({ message: "Follow up set successfully." })
    }

    const followUp = new FollowUp({ date, leadId, timeZone })
    savedFollowUP = await followUp.save()
    if (!savedFollowUP) {
      let error = new Error("Error while saving follow up")
      throw error
    }
    return res.status(201).json({ message: "Follow up set successfully." })
  } catch (e) {
    return res.status(400).json({ error: "Error while adding follow up." })
  }
})

module.exports = router
