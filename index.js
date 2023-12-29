const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const dbConnection = require("./Db")
const productRouter = require("./Routes/Products")
const orderRouter = require('./Routes/Order')


const app = express()

// Dot env configuration
dotenv.config()
const PORT = process.env.PORT

// Database connection
dbConnection()

// Middlewares
app.use(express.json())
app.use(cors())

// Routes
app.use("/api",productRouter)
app.use("/",orderRouter)
// Server 
app.listen(PORT,()=>console.log(`App listening on port no : ${PORT}`))