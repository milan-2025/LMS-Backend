const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.header("Authorization").replace("Bearer ", "")
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Find the user by ID and check if the token is valid
    const user = await User.findOne({ _id: decoded._id })

    if (!user) {
      throw new Error()
    }

    // Attach the user and token to the request object
    req.token = token
    req.user = user
    next()
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." })
  }
}

module.exports = auth
