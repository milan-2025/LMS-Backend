const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const auth = require("../middlewares/auth")

const router = express.Router()

// User Registration
router.post("/sign-up", async (req, res) => {
  const { fullName, email, password } = req.body
  try {
    const user = new User({ fullName, email, password })
    await user.save()
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "9h" }
    )
    return res.status(201).send({ token })
  } catch (e) {
    return res.status(400).send({ error: e.message })
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).send({ error: "Invalid login credentials" })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid login credentials" })
    }
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "9h" }
    )

    return res.status(200).send({ token })
  } catch (e) {
    return res.status(500).send({ error: e.message })
  }
})

router.post("/validate-token", async (req, res) => {
  try {
    // Get the token from the Authorization header
    const token = req.header("Authorization").replace("Bearer ", "")
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Find the user by ID and check if the token is valid
    const user = await User.findOne({ _id: decoded._id })

    if (!user) {
      throw new Error("Invalid token")
    }
    return res.status(200).json({ message: "valid token" })
  } catch (e) {
    return res.status(400).send({ error: e.message })
  }
})

module.exports = router
