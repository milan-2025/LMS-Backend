const express = require("express")
const Lead = require("../models/Lead")
const xlsx = require("xlsx")
const fs = require("fs")

const upload = require("../middlewares/fileUpload")
const auth = require("../middlewares/auth")
const PhoneNumber = require("../models/PhoneNumber")
const Email = require("../models/Email")
const Response = require("../models/Response")
const Comment = require("../models/Comment")
const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const timezone = require("dayjs/plugin/timezone")
const FollowUp = require("../models/FollowUp")
const HotLead = require("../models/HotLead")
const mongoose = require("mongoose")
const CallsDone = require("../models/CallsDone")
const FoundedEmail = require("../models/FoundedEmail")
const QuotesReceived = require("../models/QuotesReceived")
const LoadsCovered = require("../models/LoadsCovered")
// const EmailsFound = require("../models/EmailsFound")

dayjs.extend(utc)
dayjs.extend(timezone)

const router = express.Router()

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." })
    }

    const filePath = req.file.path
    const workbook = xlsx.readFile(filePath)
    if (workbook.SheetNames.length > 1) {
      return res
        .status(400)
        .json({ error: "Upload a excell file with single sheet." })
    }
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(sheet)

    // Get the user ID from the request object, which was set by the auth middleware
    const userId = req.user._id

    const oldCount = await Lead.find({
      addedBy: userId,
    }).countDocuments()

    let newlyAdded = data.length

    const documents = data.map((row) => ({
      shipper: row.shipper || "",
      contactPerson: row.contactPerson || "",
      address: row.address || "",
      state: row.state || "",
      timeZone: row.timeZone || "PST",
      phoneNumber: row.phoneNumber || "",
      website: row.website || "",
      commodity: row.commodity || "",
      email: row.email || "",
      addedBy: userId, // Add the user's ID to the document
    }))

    let inserted = await Lead.insertMany(documents)
    let newCount = await Lead.find({
      addedBy: userId,
    }).countDocuments()

    if (newCount > oldCount) {
    } else {
      let error = new Error("Got error while uploading leads")
      throw error
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.log("error while deleting file", err)
        throw err
      }
      console.log("file deleted successfully.")
    })

    return res.status(200).json({ message: "Data imported successfully!" })
  } catch (error) {
    console.error("Error importing data:", error)
    return res.status(500).json({ error: "Failed to import data." })
  }
})

router.get("/get-leads", auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1 // Default to page 1
    const limit = parseInt(req.query.limit) || 10 // Default to 10 items per page

    const skip = (page - 1) * limit
    const totalItems = await Lead.find({
      addedBy: req.user._id,
    }).countDocuments()
    const totalPages = Math.ceil(totalItems / limit)
    let leads = await Lead.find({
      addedBy: req.user._id,
    })
      .skip(skip)
      .limit(limit)
    if (!leads) {
      let error = new Error("Got error while extracting leads")
      throw error
    }
    return res
      .status(200)
      .json({ leads: leads, page, limit, totalPages, totalItems })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Got error while extracting leads" })
  }
})

router.post("/add-phone-number", auth, async (req, res, next) => {
  const { phoneNumber, comment, leadId } = req.body
  try {
    let lead = await Lead.findById(leadId)
    if (lead.phoneNumber.length > 0) {
      const phnNumber = new PhoneNumber({ phoneNumber, comment, leadId })
      await phnNumber.save()
      return res.status(201).json({ message: "Phone number added !!!" })
    } else {
      lead.phoneNumber = phoneNumber
      await lead.save()
      return res.status(201).json({ message: "Phone number added !!!" })
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while adding phone number." })
  }
})

router.get("/get-phone-numbers", auth, async (req, res, next) => {
  const leadId = req.query.leadId
  // console.log("leadId", leadId)
  try {
    const phoneNumbers = await PhoneNumber.find({
      leadId: leadId,
    })
    if (!phoneNumbers) {
      let newError = new Error("Error while getting phone numbers.")
      throw newError
    }
    return res.status(200).json({
      phoneNumbers,
    })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while fetching phone numbers." })
  }
})

router.post("/add-email", auth, async (req, res, next) => {
  const { phoneNumber, comment, leadId } = req.body
  try {
    let lead = await Lead.findById(leadId)
    if (lead.email.length > 0) {
      const alreadyPresentEmails = await Email.find({ leadId }).countDocuments()
      if (alreadyPresentEmails >= 10) {
        return res.status(400).json({
          error: "You have already stored 11 emails delete some to store more.",
        })
      }
      const emailInstance = new Email({ email: phoneNumber, comment, leadId })
      await emailInstance.save()
      return res.status(201).json({ message: "Email added !!!" })
    } else {
      lead.email = phoneNumber
      await lead.save()
      return res.status(201).json({ message: "Email added !!!" })
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while adding email." })
  }
})

router.get("/get-emails", auth, async (req, res, next) => {
  const leadId = req.query.leadId
  // console.log("leadId", leadId)
  try {
    const emails = await Email.find({
      leadId: leadId,
    })
    if (!emails) {
      let newError = new Error("Error while getting emails.")
      throw newError
    }
    return res.status(200).json({
      phoneNumbers: emails,
    })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while fetching emails." })
  }
})

router.post("/add-response", auth, async (req, res, next) => {
  try {
    const { leadId, response } = req.body
    const newResponse = new Response({ leadId, response })
    await newResponse.save()
    const foundLead = await Lead.findById(leadId)
    const currentMilliseconds = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      })
    ).getTime()
    switch (response) {
      case "Not Connected-RNR-VM":
        foundLead.status = "Not Connected-RNR-VM"
        await foundLead.save()
        break
      case "Invalid number":
      case "Freight On Board (FOB)":
      case "Customer Routed":
      case "Do Not Desturb (DND)":
      case "Not Interested":
        foundLead.status = "DND"
        await foundLead.save()
        break
      case "Email Follow Up":
        foundLead.status = "Email Follow Up"
        await foundLead.save()
        break
      case "Call Follow Up":
        foundLead.status = "Call Follow Up"
        await foundLead.save()
        break
      case "Callback Later":
        foundLead.status = "Callback Later"
        await foundLead.save()
        break
      case "Email Sent":
        foundLead.status = "Email Sent"
        await foundLead.save()
        break
      case "Quote Received":
      case "Load Received":
        foundLead.status = "Prospect"
        await foundLead.save()
        break
      case "Load covered":
        foundLead.status = "Customer Added"
        await foundLead.save()
        break
    }
    switch (response) {
      case "Not Connected-RNR-VM":
      case "Freight On Board (FOB)":
      case "Customer Routed":
      case "Do Not Desturb (DND)":
      case "Not Interested":
      case "Call Follow Up":
      case "Email Follow Up":
      case "Invalid number":
      case "Callback Later":
        // callDone code
        let alreadycallsDone = await CallsDone.find({
          addedBy: req.user._id,
          leadId: leadId,
        })
        // console.log("alreadyCallsDone---", alreadycallsDone)
        if (alreadycallsDone.length > 0) {
          let oldDate =
            alreadycallsDone[alreadycallsDone.length - 1].date.getTime()
          // console.log("oldDate--,", oldDate)
          // console.log("now date---", Date.now())
          if (Math.abs(currentMilliseconds - oldDate) > 9 * 60 * 60 * 1000) {
            let callDone = new CallsDone({
              addedBy: req.user._id,
              date: currentMilliseconds,
              leadId: leadId,
            })
            await callDone.save()
          }
        } else {
          let callDone = new CallsDone({
            addedBy: req.user._id,
            date: currentMilliseconds,
            leadId: leadId,
          })
          await callDone.save()
        }
        break
      case "Email Sent":
        // callDone
        let alreadycallsDoneforEmail = await CallsDone.find({
          addedBy: req.user._id,
          leadId: leadId,
        })
        if (alreadycallsDoneforEmail.length > 0) {
          let oldDate =
            alreadycallsDoneforEmail[
              alreadycallsDoneforEmail.length - 1
            ].date.getTime()
          if (Math.abs(currentMilliseconds - oldDate) > 9 * 60 * 60 * 1000) {
            let callDone = new CallsDone({
              addedBy: req.user._id,
              date: currentMilliseconds,
              leadId: leadId,
            })
            await callDone.save()
          }
        } else {
          let callDone = new CallsDone({
            addedBy: req.user._id,
            date: currentMilliseconds,
            leadId: leadId,
          })
          await callDone.save()
        }
        // email found code
        let alreadyEmailsFound = await FoundedEmail.find({
          addedBy: req.user._id,
          leadId: leadId,
        })
        if (alreadyEmailsFound.length > 0) {
          let oldDate =
            alreadyEmailsFound[alreadyEmailsFound.length - 1].date.getTime()
          if (Math.abs(currentMilliseconds - oldDate) > 9 * 60 * 60 * 1000) {
            let foundedEmail = new FoundedEmail({
              addedBy: req.user._id,
              date: currentMilliseconds,
              leadId: leadId,
            })
            await foundedEmail.save()
          }
        } else {
          let foundedEmail = new FoundedEmail({
            addedBy: req.user._id,
            date: currentMilliseconds,
            leadId: leadId,
          })
          await foundedEmail.save()
        }
        break
      case "Quote Received":
      case "Load Received":
        // quote received code
        let alreadyQuoteReceived = await QuotesReceived.find({
          addedBy: req.user._id,
          leadId: leadId,
        })
        if (alreadyQuoteReceived.length > 0) {
          let oldDate =
            alreadyQuoteReceived[alreadyQuoteReceived.length - 1].date.getTime()
          if (Math.abs(currentMilliseconds - oldDate) > 9 * 60 * 60 * 1000) {
            let newQuote = new QuotesReceived({
              addedBy: req.user._id,
              date: currentMilliseconds,
              leadId: leadId,
            })
            await newQuote.save()
          }
        } else {
          let newQuote = new QuotesReceived({
            addedBy: req.user._id,
            date: currentMilliseconds,
            leadId: leadId,
          })
          await newQuote.save()
        }
        break
      case "Load covered":
        // loads covered code

        let alreadyLoadsCovered = await LoadsCovered.find({
          addedBy: req.user._id,
          leadId: leadId,
        })
        if (alreadyLoadsCovered.length > 0) {
          let oldDate =
            alreadyLoadsCovered[alreadyQuoteReceived.length - 1].date.getTime()
          if (Math.abs(currentMilliseconds - oldDate) > 9 * 60 * 60 * 1000) {
            let newLoad = new LoadsCovered({
              addedBy: req.user._id,
              date: currentMilliseconds,
              leadId: leadId,
            })
            await newLoad.save()
          }
        } else {
          let newLoad = new LoadsCovered({
            addedBy: req.user._id,
            date: currentMilliseconds,
            leadId: leadId,
          })
          await newLoad.save()
        }
        break
    }
    return res.status(201).json({
      message: "Response added successfully.",
    })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while adding response." })
  }
})

router.post("/add-comment", auth, async (req, res, next) => {
  try {
    const { leadId, comment } = req.body
    const newComment = new Comment({ leadId, comment })
    await newComment.save()
    return res.status(201).json({
      message: "Comment added successfully.",
    })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while adding Comment." })
  }
})

router.get("/filtered-options", auth, async (req, res, next) => {
  try {
    const timezones = [
      { name: "PST", id: "America/Los_Angeles" },
      { name: "MST", id: "America/Denver" },
      { name: "CST", id: "America/Chicago" },
      { name: "EST", id: "America/New_York" },
    ]
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

    let mainQuery = {
      addedBy: req.user._id,
    }

    const { field } = req.query
    const { value } = req.query
    const { tbValue } = req.query
    if (tbValue == "All") {
      const options = await Lead.find(
        {
          [field]: { $regex: value, $options: "i" },
          addedBy: req.user._id,
        },
        {
          [field]: 1,
        }
      ).limit(10)

      return res.status(200).json({
        options,
      })
    } else if (tbValue == "Follow Ups") {
      // const strField = `lead.${field}`

      const pipeline = [
        {
          $lookup: {
            from: "leads", // The name of the collection for your Lead model
            localField: "lead",
            foreignField: "_id",
            as: "lead",
          },
        },
        {
          $unwind: "$lead",
        },
        {
          $match: {
            ...mainQuery,
            ["lead." + field]: { $regex: value, $options: "i" },
            $or: dueTimezoneConditions,
          },
        },
        {
          $project: {
            ["lead." + field]: 1,
          },
        },
        {
          $limit: 10,
        },
      ]
      const options = await FollowUp.aggregate(pipeline)
      return res.status(200).json({
        options,
      })
    } else if (tbValue == "Hot Leads") {
      const pipeline = [
        {
          $lookup: {
            from: "leads", // The name of the collection for your Lead model
            localField: "lead",
            foreignField: "_id",
            as: "lead",
          },
        },
        {
          $unwind: "$lead",
        },
        {
          $match: {
            ...mainQuery,
            ["lead." + field]: { $regex: value, $options: "i" },
          },
        },
        {
          $project: {
            ["lead." + field]: 1,
          },
        },
        {
          $limit: 10,
        },
      ]
      const options = await HotLead.aggregate(pipeline)
      return res.status(200).json({
        options,
      })
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while getting options." })
  }
})

router.post("/get-filtered-leads", auth, async (req, res, next) => {
  try {
    let { state, commodity, timeZone, status, page, limit } = req.body
    let query = {
      addedBy: req.user._id,
    }
    if (state.length > 0) {
      query.state = new RegExp(state, "i")
    }
    if (commodity.length > 0) {
      query.commodity = new RegExp(commodity, "i")
    }
    if (timeZone.length > 0) {
      query.timeZone = new RegExp(timeZone, "i")
    }
    if (status.length > 0) {
      query.status = new RegExp(status, "i")
    }

    const skip = (page - 1) * limit
    const totalItems = await Lead.find(query).countDocuments()
    const totalPages = Math.ceil(totalItems / limit)

    let filteredLeads = await Lead.find(query).skip(skip).limit(limit)
    return res
      .status(200)
      .json({ filteredLeads, page, limit, totalItems, totalPages })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while getting filtered leads." })
  }
})

router.post("/get-filtered-leads/follow-up", auth, async (req, res, next) => {
  let { state, commodity, timeZone, status, page, limit } = req.body
  try {
    const timezones = [
      { name: "PST", id: "America/Los_Angeles" },
      { name: "MST", id: "America/Denver" },
      { name: "CST", id: "America/Chicago" },
      { name: "EST", id: "America/New_York" },
    ]
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

    let mainQuery = {
      addedBy: req.user._id,
    }

    if (state && state.length > 0) {
      mainQuery["lead.state"] = new RegExp(state, "i")
    }
    if (commodity && commodity.length > 0) {
      mainQuery["lead.commodity"] = new RegExp(commodity, "i")
    }
    if (timeZone && timeZone.length > 0) {
      mainQuery["lead.timeZone"] = new RegExp(timeZone, "i")
    }
    if (status && status.length > 0) {
      mainQuery["lead.status"] = new RegExp(status, "i")
    }
    const skip = (page - 1) * limit

    const pipeline = [
      // Stage 1: Join with the 'leads' collection
      {
        $lookup: {
          from: "leads", // The name of the collection for your Lead model
          localField: "lead",
          foreignField: "_id",
          as: "lead",
        },
      },
      // Stage 2: Deconstruct the 'lead' array to a single object
      {
        $unwind: "$lead",
      },
      // Stage 3: Apply all filters at once
      {
        $match: {
          ...mainQuery,
          $or: dueTimezoneConditions,
        },
      },
      // Stage 4 (Optional): Project the final fields you need
      {
        $project: {
          // Exclude the addedBy field and include lead fields
          addedBy: 0,
        },
      },
      {
        $skip: skip,
      },
      // Stage 5: Limit the number of documents to return
      {
        $limit: limit,
      },
    ]
    const countPipeline = [
      {
        $lookup: {
          from: "leads", // The name of the collection for your Lead model
          localField: "lead",
          foreignField: "_id",
          as: "lead",
        },
      },
      // Stage 2: Deconstruct the 'lead' array to a single object
      {
        $unwind: "$lead",
      },
      // Stage 3: Apply all filters at once
      {
        $match: {
          ...mainQuery,
          $or: dueTimezoneConditions,
        },
      },
      {
        $count: "totalCount",
      },
    ]
    const countResult = await FollowUp.aggregate(countPipeline)
    const totalItems = countResult.length > 0 ? countResult[0].totalCount : 0

    const totalPages = Math.ceil(totalItems / limit)
    const filteredFollowUps = await FollowUp.aggregate(pipeline)

    return res.status(200).json({
      filteredFollowUps,
      totalItems,
      totalPages,
      page,
      limit,
    })
  } catch (e) {
    console.log("err, ", e)
    return res.status(400).json({
      error: e.message || "Error while getting filtered followup leads.",
    })
  }
})

router.post("/get-filtered-leads/hot-leads", auth, async (req, res) => {
  let { state, commodity, timeZone, status, page, limit } = req.body
  try {
    let mainQuery = {
      addedBy: req.user._id,
    }

    if (state && state.length > 0) {
      mainQuery["lead.state"] = new RegExp(state, "i")
    }
    if (commodity && commodity.length > 0) {
      mainQuery["lead.commodity"] = new RegExp(commodity, "i")
    }
    if (timeZone && timeZone.length > 0) {
      mainQuery["lead.timeZone"] = new RegExp(timeZone, "i")
    }
    if (status && status.length > 0) {
      mainQuery["lead.status"] = new RegExp(status, "i")
    }
    const skip = (page - 1) * limit

    const pipeline = [
      // Stage 1: Join with the 'leads' collection
      {
        $lookup: {
          from: "leads", // The name of the collection for your Lead model
          localField: "lead",
          foreignField: "_id",
          as: "lead",
        },
      },
      // Stage 2: Deconstruct the 'lead' array to a single object
      {
        $unwind: "$lead",
      },
      // Stage 3: Apply all filters at once
      {
        $match: {
          ...mainQuery,
        },
      },
      // Stage 4 (Optional): Project the final fields you need
      {
        $project: {
          // Exclude the addedBy field and include lead fields
          addedBy: 0,
        },
      },
      {
        $skip: skip,
      },
      // Stage 5: Limit the number of documents to return
      {
        $limit: limit,
      },
    ]
    const countPipeline = [
      {
        $lookup: {
          from: "leads", // The name of the collection for your Lead model
          localField: "lead",
          foreignField: "_id",
          as: "lead",
        },
      },
      // Stage 2: Deconstruct the 'lead' array to a single object
      {
        $unwind: "$lead",
      },
      // Stage 3: Apply all filters at once
      {
        $match: {
          ...mainQuery,
        },
      },
      {
        $count: "totalCount",
      },
    ]
    const countResult = await HotLead.aggregate(countPipeline)
    const totalItems = countResult.length > 0 ? countResult[0].totalCount : 0

    const totalPages = Math.ceil(totalItems / limit)
    const filteredHotLeads = await HotLead.aggregate(pipeline)

    return res.status(200).json({
      filteredHotLeads,
      totalItems,
      totalPages,
      page,
      limit,
    })
  } catch (e) {
    console.log("err, ", e)
    return res.status(400).json({
      error: e.message || "Error while getting filtered Hot leads.",
    })
  }
})

router.get("/get-lead-info-by-id", auth, async (req, res) => {
  try {
    const { leadId } = req.query
    const lead = await Lead.findById(leadId)
    if (!lead) {
      let err = new Error("Lead not found")
      throw err
    }
    return res.status(200).json({
      lead: lead,
    })
  } catch (e) {
    return res.status(400).json({
      error: e.message || "Error while finding lead.",
    })
  }
})

router.get("/get-responses", auth, async (req, res) => {
  try {
    const { leadId } = req.query
    let responses = await Response.find({ leadId: leadId })
    return res.status(200).json({
      responses,
    })
  } catch (e) {
    return res.status(400).json({
      error: e.message || "Error while finding responses.",
    })
  }
})

router.get("/get-comments", auth, async (req, res) => {
  try {
    const { leadId } = req.query
    let comments = await Comment.find({ leadId: leadId })
    return res.status(200).json({
      comments,
    })
  } catch (e) {
    return res.status(400).json({
      error: e.message || "Error while finding comments.",
    })
  }
})

router.post("/chk-hot-lead", auth, async (req, res) => {
  try {
    const { leadId } = req.body
    const hotLead = await HotLead.find({
      lead: leadId,
    })
    if (hotLead.length > 0) {
      return res.status(200).json({ hotLeadIncludes: true })
    } else {
      return res.status(200).json({ hotLeadIncludes: false })
    }
  } catch (e) {
    return res.status(400).json({
      error: e.message || "Error while checking hot leads.",
    })
  }
})

router.post("/add-hot-lead", auth, async (req, res) => {
  try {
    const { leadId } = req.body
    const userId = req.user._id
    const hotLead = new HotLead({
      lead: leadId,
      addedBy: userId,
    })
    await hotLead.save()
    return res.status(201).json({ message: "Lead added to Hot Leads." })
  } catch (e) {
    return res.status(400).json({
      error: e.message || "Error while adding hot leads.",
    })
  }
})

router.post("/remove-hot-lead", auth, async (req, res) => {
  try {
    const { leadId } = req.body
    await HotLead.findOneAndDelete({
      lead: leadId,
    })

    return res.status(200).json({ message: "Removed Successfully" })
  } catch (e) {
    return res.status(400).json({
      error: e.message || "Error while removing hot leads.",
    })
  }
})

router.get("/get-hot-leads", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 5
    const totalItems = await HotLead.find({
      addedBy: req.user._id,
    }).countDocuments()
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(totalItems / limit)

    const hotLeads = await HotLead.find({ addedBy: req.user._id })
      .skip(skip)
      .limit(limit)
      .populate("lead")
      .exec()

    return res.status(200).json({
      hotLeads,
      page,
      limit,
      totalItems,
      totalPages,
    })
  } catch (e) {
    // console.log(e)
    return res.status(400).json({
      error: e.message || "Error while getting hot leads.",
    })
  }
})

router.post("/get-bulk-emails", auth, async (req, res) => {
  try {
    let { state, commodity, timeZone, status, button, limit } = req.body
    // console.log("user:-", String(req.user._id))

    let leadQuery = {}

    if (state.length > 0) {
      leadQuery["state"] = new RegExp(state, "i")
    }
    if (commodity.length > 0) {
      leadQuery["commodity"] = new RegExp(commodity, "i")
    }
    if (timeZone.length > 0) {
      leadQuery["timeZone"] = new RegExp(timeZone, "i")
    }
    if (status.length > 0) {
      leadQuery["status"] = new RegExp(status, "i")
    }

    const countPipeline = [
      {
        $match: {
          addedBy: req.user._id,
          email: { $ne: "" },
          ...leadQuery,
        },
      },
      {
        $lookup: {
          from: "emails",
          localField: "_id",
          foreignField: "leadId",
          as: "emails",
        },
      },
      {
        $count: "totalCount",
      },
    ]

    const totalCountResult = await Lead.aggregate(countPipeline)

    let totalLeads =
      totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0
    let skip = (button - 1) * limit

    const EmailPipeline = [
      {
        $match: {
          addedBy: req.user._id,
          email: { $ne: "" },
          ...leadQuery,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "emails",
          localField: "_id",
          foreignField: "leadId",
          as: "emails",
        },
      },
      {
        $addFields: {
          emailCount: { $size: "$emails" },
        },
      },
      {
        $project: {
          _id: 0,
          email: 1,
          "emails.email": 1,
          emailCount: 1,
        },
      },
    ]

    let totalButtons = Math.ceil(totalLeads / limit)
    let foundEmails = await Lead.aggregate(EmailPipeline)
    return res.status(200).json({
      emailData: foundEmails,
      totalLeads,
      totalButtons,
    })
  } catch (e) {
    console.log("error in bulk email:-", e)
    return res
      .status(400)
      .json({ error: e.message || "error while getting bulk emails." })
  }
})

router.post("/get-bulk-emails-follow-ups", auth, async (req, res) => {
  try {
    let { state, commodity, timeZone, status, button, limit } = req.body
    // console.log("user:-", String(req.user._id))
    const timezones = [
      { name: "PST", id: "America/Los_Angeles" },
      { name: "MST", id: "America/Denver" },
      { name: "CST", id: "America/Chicago" },
      { name: "EST", id: "America/New_York" },
    ]
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
        "followups.timeZone": tzone.name,
        "followups.date": { $lte: nowDate.toDate() },
      }
    })

    let query = {
      addedBy: req.user._id,
      email: { $ne: "" },
    }
    if (state.length > 0) {
      query.state = new RegExp(state, "i")
    }
    if (commodity.length > 0) {
      query.commodity = new RegExp(commodity, "i")
    }
    if (timeZone.length > 0) {
      query.timeZone = new RegExp(timeZone, "i")
    }
    if (status.length > 0) {
      query.status = new RegExp(status, "i")
    }

    const followUpMatch = {
      "followups.addedBy": req.user._id,
      $or: dueTimezoneConditions,
    }

    const EmailCountPipeline = [
      {
        $lookup: {
          from: "followups",
          localField: "_id",
          foreignField: "lead",
          as: "followups",
        },
      },
      {
        $match: {
          ...query,
          ...followUpMatch,
        },
      },
      {
        $unwind: "$followups",
      },
      {
        $lookup: {
          from: "emails",
          localField: "_id",
          foreignField: "leadId",
          as: "emails",
        },
      },
      {
        $count: "totalCount",
      },
    ]

    const totaldepthCount = await Lead.aggregate(EmailCountPipeline)
    const totalLeads =
      totaldepthCount.length > 0 ? totaldepthCount[0].totalCount : 0
    let skip = (button - 1) * limit
    const EmailPipeline = [
      {
        $lookup: {
          from: "followups",
          localField: "_id",
          foreignField: "lead",
          as: "followups",
        },
      },
      {
        $match: {
          ...query,
          ...followUpMatch,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $unwind: "$followups",
      },
      {
        $lookup: {
          from: "emails",
          localField: "_id",
          foreignField: "leadId",
          as: "emails",
        },
      },
      {
        $addFields: {
          emailCount: { $size: "$emails" },
        },
      },
      {
        $project: {
          _id: 0,
          email: 1,
          "emails.email": 1,
          emailCount: 1,
        },
      },
    ]
    const foundEmails = await Lead.aggregate(EmailPipeline)
    let depthEmails = 0
    foundEmails.forEach((email) => {
      depthEmails += email.emailCount
    })
    const totalfoundEmails = totalLeads + depthEmails
    const totalButtons = Math.ceil(totalLeads / limit)
    return res.status(200).json({
      emailData: foundEmails,
      totalFoundEmails: totalfoundEmails,
      totalLeads: totalLeads,
      totalButtons: totalButtons,
    })
  } catch (e) {
    console.log("error in bulk email:-", e)
    return res
      .status(400)
      .json({ error: e.message || "error while getting bulk emails." })
  }
})

router.post("/get-bulk-emails-hot-leads", auth, async (req, res) => {
  try {
    let { state, commodity, timeZone, status, button, limit } = req.body
    let query = {
      addedBy: req.user._id,
      email: { $ne: "" },
    }
    if (state.length > 0) {
      query.state = new RegExp(state, "i")
    }
    if (commodity.length > 0) {
      query.commodity = new RegExp(commodity, "i")
    }
    if (timeZone.length > 0) {
      query.timeZone = new RegExp(timeZone, "i")
    }
    if (status.length > 0) {
      query.status = new RegExp(status, "i")
    }

    const countPipeline = [
      {
        $lookup: {
          from: "hotleads",
          localField: "_id",
          foreignField: "lead",
          as: "hotLeads",
        },
      },
      {
        $unwind: "$hotLeads",
      },
      {
        $match: {
          ...query,
          "hotLeads.addedBy": req.user._id,
        },
      },
      {
        $lookup: {
          from: "emails",
          localField: "_id",
          foreignField: "leadId",
          as: "emails",
        },
      },
      {
        $count: "totalCount",
      },
    ]

    let totalLeadsResult = await Lead.aggregate(countPipeline)
    let totalLeads =
      totalLeadsResult.length > 0 ? totalLeadsResult[0].totalCount : 0
    let skip = (button - 1) * limit
    let totalButtons = Math.ceil(totalLeads / limit)
    const emailPipeline = [
      {
        $lookup: {
          from: "hotleads",
          localField: "_id",
          foreignField: "lead",
          as: "hotLeads",
        },
      },
      {
        $unwind: "$hotLeads",
      },
      {
        $match: {
          ...query,
          "hotLeads.addedBy": req.user._id,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "emails",
          localField: "_id",
          foreignField: "leadId",
          as: "emails",
        },
      },
      {
        $addFields: {
          emailCount: { $size: "$emails" },
        },
      },
      {
        $project: {
          _id: 0,
          email: 1,
          "emails.email": 1,
          emailCount: 1,
        },
      },
    ]

    const foundEmails = await Lead.aggregate(emailPipeline)
    return res
      .status(200)
      .json({ emailData: foundEmails, totalLeads, totalButtons })
  } catch (e) {
    console.log("error in bulk email:-", e)
    return res
      .status(400)
      .json({ error: e.message || "error while getting bulk emails." })
  }
})

module.exports = router
