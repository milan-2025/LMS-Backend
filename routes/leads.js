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

    const documents = data.map((row) => ({
      shipper: row.shipper?.trim() || "",
      contactPerson: row.contactPerson?.trim() || "",
      address: row.address?.trim() || "",
      state: row.state?.trim() || "",
      timeZone: row.timeZone?.trim() || "",
      phoneNumber: row.phoneNumber?.trim() || "",
      website: row.website?.trim() || "",
      commodity: row.commodity?.trim() || "",
      email: row.email?.trim() || "",
      addedBy: userId, // Add the user's ID to the document
    }))

    await Lead.insertMany(documents)

    fs.unlink(filePath, (err) => {
      if (err) {
        console.log("error while deleting file", err)
        throw err
      }
      console.log("file deleted successfully.")
    })

    res.status(200).json({ message: "Data imported successfully!" })
  } catch (error) {
    console.error("Error importing data:", error)
    res.status(500).json({ error: "Failed to import data." })
  }
})

router.get("/get-leads", auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1 // Default to page 1
    const limit = parseInt(req.query.limit) || 10 // Default to 10 items per page

    const skip = (page - 1) * limit
    const totalItems = await Lead.countDocuments()
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
    const phnNumber = new PhoneNumber({ phoneNumber, comment, leadId })
    await phnNumber.save()
    return res.status(201).json({ message: "Phone number added !!!" })
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
    const emailInstance = new Email({ email: phoneNumber, comment, leadId })
    await emailInstance.save()
    return res.status(201).json({ message: "Email added !!!" })
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
    switch (response) {
      case "Not Connected":
        foundLead.status = "Not Connected"
        await foundLead.save()
        break
      case "Freight On Board (FOB)":
      case "Customer Routed":
      case "Do Not Desturb (DND)":
      case "Not Interested":
        foundLead.status = "DND"
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
    const { field } = req.query
    const { value } = req.query
    const options = await Lead.find(
      {
        [field]: { $regex: value, $options: "i" },
      },
      {
        [field]: 1,
      }
    ).limit(10)

    return res.status(200).json({
      options,
    })
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message || "Error while getting options." })
  }
})

module.exports = router
