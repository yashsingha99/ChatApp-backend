const express = require("express")
const { register, login, logoutUser, getCurrentUser, fetchAllUsersController } = require("../Controllers/user.controllers")
const verifyJwt = require("../middleware/user.middleware")
const Router = express.Router()
Router.post("/", login)
Router.post("/signup", register)
Router.get("/logout", verifyJwt, logoutUser)
Router.get("/getCurrentUser",verifyJwt, getCurrentUser)
Router.get("/fetchAllUsers",verifyJwt, fetchAllUsersController)

module.exports = Router
