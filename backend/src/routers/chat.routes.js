const express = require("express");
const Router = express.Router();
const {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroupChat,
  createUserChat,
  groupExit,
  addParticipants
} = require("../Controllers/chat.controller");
const verifyJwt = require('../middleware/user.middleware')

Router.post('/',verifyJwt, accessChat)
Router.post('/fetchChats',verifyJwt, fetchChats)
Router.post('/fetchGroups',verifyJwt, fetchGroups)
Router.post('/createGroupChat',verifyJwt, createGroupChat)
Router.post('/createUserChat',verifyJwt, createUserChat)
Router.post('/groupExit',verifyJwt, groupExit)
Router.post('/addParticipants',verifyJwt, addParticipants)
module.exports = Router;
