require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const userRoutes = require("./routes/user")
const leadRoutes = require("./routes/leads")
const followUpRoutes = require("./routes/followUp")
const reportRoutes = require("./routes/reports")

const app = express()
const port = process.env.PORT || 3000

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`)
    })
  })
  .catch((err) => console.error("Could not connect to MongoDB...", err))

// app.get("/", (req, res) => {
//   res.send("Welcome to the CRUD API!")
// })
app.use(cors())
app.use(express.json())

app.use("/api/users", userRoutes)
app.use("/api/leads", leadRoutes)
app.use("/api/follow-up", followUpRoutes)
app.use("/api/reports", reportRoutes)
