const {
  sendMessages,
  allMessages,
  deleteMessage
} = require("../Controllers/message.controller");
const express = require("express");
const Router = express.Router();
const verifyJwt  = require("../middleware/user.middleware");

Router.post("/:chatId",verifyJwt, allMessages);
Router.post("/", verifyJwt, sendMessages);
Router.post("/deleteMessage/:msgId", verifyJwt, deleteMessage);

module.exports = Router;
