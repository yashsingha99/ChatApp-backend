const express = require('express')
const dotenv = require('dotenv')
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")
dotenv.config({
    path:"./env"
})

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


app.get("/", (req, res) => {
  res.send("API is running123");
});  


//* ROUTERS .....
const  userRoutes  =  require('./routers/user.routes')
const  messageRoutes  =  require('./routers/message.routes')
const  chatRoutes  =  require('./routers/chat.routes')

app.use("/user", userRoutes)
app.use("/chat", chatRoutes)
app.use("/message", messageRoutes)

//! Error  Handling  middlewares
// app.use(notFound)
// app.use(errorHandler)
module.exports = app
