const mongoose = require("mongoose")
const dotenv = require("dotenv")

// Dot env configuration
dotenv.config()
const MONGODB_URL = process.env.MONGODB_URL

// Connecting database
const dbConnection = async() => {
try {
    await mongoose.connect(MONGODB_URL)
    console.log("Successfuly db connected")
} catch (error) {
    console.log("Mongo Error ",error)
}
}

module.exports = dbConnection