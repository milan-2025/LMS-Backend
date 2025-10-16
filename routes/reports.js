const express = require("express")
const auth = require("../middlewares/auth")
const CallsDone = require("../models/CallsDone")

const router = express.Router()

router.get("/get-general-report", auth, async (req, res) => {
  try {
    const today = new Date().getDay()

    let obj = {}

    for (let i = 0; i <= 6 - today; i++) {
      let dateRange = [
        Date.now() + 24 * i * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
        Date.now() + 24 * i * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
      ]
      obj[today + i] = dateRange
    }

    for (let i = today; i > 0; i--) {
      let j = 0
      let dateRange = [
        Date.now() - 24 * i * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
        Date.now() - 24 * i * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
      ]
      obj[j] = dateRange
      j++
    }

    // const todayRange = [
    //   Date.now() - 12 * 60 * 60 * 1000,
    //   Date.now() + 12 * 60 * 60 * 1000,
    // ]

    // const generateDateRanges = (today) => {
    //   let obj = {}
    //   switch (today) {
    //     case 0:
    //       obj.Mon = todayRange
    //       for (let i = today; i <= 6; i++) {
    //         let dateRange = [
    //           Date.now() + 24 * i * 60 * 60 * 1000 - 12 * 60 * 60 * 1000,
    //           Date.now() + 24 * i * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
    //         ]
    //         obj[i] = dateRange
    //       }
    //   }
    // }
  } catch (e) {}
})
