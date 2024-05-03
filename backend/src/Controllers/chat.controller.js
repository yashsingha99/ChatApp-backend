const Chat = require("../Models/chat.model");
const User = require("../Models/user.models");
const Messages = require("../Models/message.models");
const { asyncHandler } = require("../utilis/AsyncHandler");

const accessChat = asyncHandler(async (req, res) => {
  try {
    const { chatId, user } = req.body;
    if (!chatId || !user)
      return res.status(400).send({ message: "Data is insufficient" });
    const chat = await Chat.findById(chatId)
      .populate("latestMessage") //*  using currentUser_id  then populate
      .populate("users", "-password -refreshToken") //* all of the thing
      .populate("groupAdmin", "-password -refreshToken");
    if (!chat) return res.status(400).send({ message: "Chat doesn't found" });
    res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
});

//* Just  fetch  all  chat  which  are  created  by  currentUser
const fetchChats = asyncHandler(async (req, res) => {
  const user = req.body.user;
  try {
    await Chat.find({ users: { $elemMatch: { $eq: user?._id } } }) //* Firstly  find  the  chat documents
      .populate("latestMessage") //*  using currentUser_id  then populate
      .populate("users", "-password") //* all of the thing
      .populate("groupAdmin", "-password")
      .sort({ updatedAt: -1 }) //* after that sort acc. to the time
      .then(async (result) => {
        result = await User.populate(result, {
          //! DOUBT
          path: "latestMessage.sender",
          select: "name email",
        });
        res.status(200).json({ allChats: result });
      });
  } catch (error) {
    res.sendStatus(400);
    throw new Error(error.message);
  }
});

//* Only  check  in  chat  document  isGroupChat is  true  then retrive that  chat until  to finish  all chat
const fetchGroups = asyncHandler(async (req, res) => {
  const user = req.body.user;
  try {
    const allGroups = await Chat.find({
      isGroupChat: true,
      /*users: { $elemMatch: { $eq: user._id } }*/
    });
    res.status(200).json({ allGroups: allGroups });
  } catch (error) {
    res.sendStatus(400);
    throw new Error(error.message);
  }
});

//* Create  a  Grp  Chat  where  all  user-participants  and  grpName
const createGroupChat = asyncHandler(async (req, res) => {
  try {
    const chatData = req.body.chatdata;
    const user = req.body.user._id;

    if (chatData.grpName === "") {
      return res.status(400).send({ message: "Data is insufficient" });
    }

    const isExistGrp = await Chat.findOne({
      chatName: chatData.grpName,
      groupAdmin: user,
    });

    if (isExistGrp) {
      return res
        .status(400)
        .send({ message: "Group already exists with this name" });
    }

    const newGrpChat = {
      chatName: chatData.grpName,
      isGroupChat: true,
      users: [user], // Instead of an object, use an array to store user IDs
      groupAdmin: user,
    };

    const createGrpChat = await Chat.create(newGrpChat);

    const FullGrpChat = await Chat.findOne({ _id: createGrpChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(FullGrpChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const createUserChat = asyncHandler(async (req, res) => {
  try {
    const chatData = req.body.chatdata;
    const user = req.body.user._id;

    if (chatData.chatName === "") {
      return res.status(400).send({ message: "Data is insufficient" });
    }

    const participate = await User.findOne({ email: chatData.chatName });
    if (!participate)
      return res.status(400).send({ message: "user doesn't exist" });

    const isExistGrp = await Chat.findOne({
      chatName: participate.name,
      groupAdmin: user,
    });

    if (isExistGrp) {
      return res
        .status(400)
        .send({ message: "chat is already exists with this name" });
    }
    const newGrpChat = {
      chatName: participate.name,
      isGroupChat: false,
      users: [user, participate._id], // Instead of an object, use an array to store user IDs
      groupAdmin: user,
    };

    const createGrpChat = await Chat.create(newGrpChat);

    const FullGrpChat = await Chat.findOne({ _id: createGrpChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(FullGrpChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const addParticipants = asyncHandler(async (req, res) => {
  const { useremail, chatId } = req.body;

  if (!useremail || !chatId) {
    return res.status(400).send({ message: "Data is insufficient" });
  }

  try {
    const findUser = await User.findOne({ email: useremail });
    if (!findUser) {
      return res
        .status(400)
        .send({ message: "User doesn't exist with this email" });
    }

    const findGrp = await Chat.findById(chatId);
    if (!findGrp) {
      return res.status(400).send({ message: "Group does not exist." });
    }

    if (!findGrp.isGroupChat) {
      return res
        .status(400)
        .send({ message: "You do not have permission to add a user." });
    }

    const response = await Chat.updateOne(
      { _id: chatId },
      { $addToSet: { users: findUser._id } }
    );
    const updatedChat = await Chat.find({ _id: chatId })
      .populate("users")
      .populate("groupAdmin")
      .populate("latestMessage");
    return res
      .status(200)
      .send({ updatedChat, message: "User successfully added." });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

//* remove  the  user  from  groupChat  (to  find  groupId)  then  update  means  delete(pull)  that  user
//* and  return  that  user
const groupExit = asyncHandler(async (req, res) => {
  const {groupAdmin, chatId, userId } = req.body;
  // console.log(chatId, userId);
  try {
    if (!userId || !chatId || !groupAdmin) {
      res.status(200);
      throw new Error(
        "Group Id and chatId both must required for exit from Group-Chat"
      );
    }
    if (groupAdmin === userId) {

      const deleteChat = await Chat.deleteOne({ _id: chatId });

      res.status(200).json({ deleteChat, message: "successfully deleted" });

    } else {
      const removedUser = await Chat.findByIdAndUpdate(
        //*  Find  document  acc.  to  chatId
        chatId,
        {
          $pull: { users: userId }, //* pull  the  user  from  users  array
        },
        {
          new: true, //*  This  is  only  for  updated  document  is  returned
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
    
    if (!removedUser) {
      res.sendStatus(404);
      throw new Error("Chat not found");
    } else {
      res.status(200).json({ removedUser, message: "successfully deleted" });
    }
  }
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroupChat,
  createUserChat,
  groupExit,
  addParticipants,
};
