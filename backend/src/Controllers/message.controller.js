const Chat = require("../Models/chat.model");
const Messages = require("../Models/message.models");
const User = require("../Models/user.models");
const { asyncHandler } = require("../utilis/AsyncHandler");

//* Just  retrive  all  messages  according  to  chatId
const allMessages = asyncHandler(async (req, res) => {
  try {
    const message = await Messages.find({ chat: req.body.chatId }) //*  find all chats(messages) using chatId which is present in params
      .populate("sender", "email name") //* populate email and name of sender using sender id
      .populate("reciever") //* populate all thing of reciever using reciever id
      .populate("chat")
      .sort({ updatedAt: -1 }); //* populate all thing of chat using chat id
    res.json(message);
  } catch (error) {
    res.send(400);
    throw new Error(error.message);
  }
});

//* Just  create a  new  Message
const sendMessages = asyncHandler(async (req, res) => {
  const { message, chatId, recieverId, user } = req.body; // fetch all field
  console.log( recieverId);
  if (!message || !chatId) {
    res.sendStatus(400);
    throw new Error("Invalid data passed into request");
  }
  const ReciverId = recieverId.users.map((data) =>  data._id)
  const newMessage = {
    sender: user._id,
    message,
    chat: chatId,
    reciever: [...ReciverId, user._id],
  };
  try {
    let createdMessage = await Messages.create(newMessage);
    let messageData = await Messages.findOne({ _id: createdMessage._id })
      .populate("sender", "-password -refreshToken")
      .populate("reciever", "-password -refreshToken")
      .populate("chat");
    messageData = await Chat.populate(messageData, {
      path: "chat.groupAdmin chat.users",
      select: "name email",
    });
    // createdMessage = await User.populate(createdMessage, {  //!DOUBT
    //   path: "chat.users",
    //   select: "name email",
    // });

    //* just  update  his  lastmessage
    await Chat.findByIdAndUpdate(chatId, { latestMessage: messageData });
    res.status(200).json(messageData);
  } catch (error) {
    res.send(400);
    throw new Error(error.message);
  }
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { chatId, user, msg, state } = req.body;
  
  try {
    if (!chatId || !user || !msg)
      return res.status(400).send({ message: "Data is insufficient" });
    if (!state) {
      const findMsg = await Messages.deleteOne({ _id: msg._id });

      res.status(200).send(findMsg, { message: "message succesfully deleted" });
    } else {
      const removedUserFromMsg = await Messages.findByIdAndUpdate(
        //*  Find  document  acc.  to  chatId
        msg._id,
        {
          $pull: { reciever: user._id}, //* pull  the  user  from  users  array
        },
        {
          new: true, //*  This  is  only  for  updated  document  is  returned
        }
      );
      if (!removedUserFromMsg)
        return res.status(400).send({ message: "message not found" });
        console.log(chatId, user, msg, state);
      res
        .status(200)
        // .send(removedUserFromMsg, { message: "message succesfully deleted" });
    }
  } catch (error) {
    res.send(400);
    throw new Error(error.message);
  }
});
module.exports = {
  allMessages,
  sendMessages,
  deleteMessage,
};
