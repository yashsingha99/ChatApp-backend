//yash
const { asyncHandler } = require("../utilis/AsyncHandler.js");
const User = require("../Models/user.models");
const ApiError = require("../utilis/ApiError");
const ApiResponse = require("../utilis/ApiResponse");
const jwt = require("jsonwebtoken");

//! THE MODEL USER CANN'T ACCESS CUSTOME METHODS BECAUSE User HAS OVERALL DATA OF ALL USERS SO WE CAN ONLY
//! ACCESS VIA ONLE ONE RECORD OF ANY USER THEN WE CAN USE MTHODS ON ONLY SINGAL TUPLES...

const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = await user.generateRefreshToken();
    const RefreshToken = await user.generateAccessToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generate access token and request token"
    );
  }
};

const register = asyncHandler(async (req, res) => {

  const { name, email, password } = req.body;
  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All credentials are required!!");
  }
  console.log(req.body);
  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new ApiError(404, " User with email already exist ");
  }
  const newUser = User.create({ name, email, password });

  const user = await User.findById(newUser?._id).select(
    "-password -refreshToken"
  );

  return res.status(200).json(user);
});

const login = asyncHandler(async (req, res) => {


  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(401, "All credentials are required");
  }

  const checkUser = await User.findOne({ email });
  console.log(checkUser);
  if (!checkUser) {
    throw new ApiError(404, "email is wrong");
  }
  const checkPassword = await checkUser.isPasswordCorrect(password);
  if (!checkPassword) {
    throw new ApiError(405, "password must same with email");
  }
  const tokens = await generateAccessRefreshToken(checkUser?._id);
  const { AccessToken, RefreshToken } = tokens;

  if (!AccessToken || !RefreshToken) {
    throw new ApiError(
      500,
      "something went wrong while fetch AccessToken and RefershToken, And cann't find AccessToken or Refresh Token"
    );
  }
  const options = {
    httpOnly: true,
    secure: true,
  };

  const userData = await User.findById(checkUser?._id).select(
    "-password -refreshToken"
  );

  if (!userData) {
    throw new ApiError(500, " something went wrong while user is autharizing");
  }
  return res
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .status(200)
    .json({ userData, AccessToken, RefreshToken, options });
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json("Successfully Logout");
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthrized request");
  }
  const decodeToken = jwt.verify(
    incomingRefreshToken,
    process.env.ACCESS_TOKEN_SECRET
  );
  const user = await User.findById(decodeToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (user?.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "refresh token has been expired");
  }

  const token = await generateAccessRefreshToken(user._id);
  const { AccessToken, RefreshToken } = token;
  options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("refreshToken", RefreshToken, options)
    .cookie("accessToken", AccessToken, options)
    .json({ accessToken: AccessToken, refreshToken: RefreshToken });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.body;
  if (!user) {
    throw new ApiError(404, "User is not authrized");
  }
  const currentUser = User.findById(user?._id).select(
    "-password -refreshToken"
  );
  res.json(currentUser);
});

const changePassWord = asyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  if (!newPassword) throw new ApiError("new Password must required");
  const user = await User.findById(req.user?._id);
  const isValidPassword = await user.isPasswordCorrect(oldPassword);
  if (!isValidPassword) throw new ApiError(404, "oldpassword mismatched");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json("password succesfully changed");
});

//* this  method helps us to fetch all user accrding to search by user either user id or email 
//* And   doesn't matter case sensitive
const fetchAllUsersController = asyncHandler(async (req, res) => {
  //* just make a regex for fetch all user and regex contains name or email which is passed by user
  const keyword = req.body.search
    ? {
        $or: [
          { name: { $regex: req.body.search, $options: "i" } },
          { email: { $regex: req.body.search, $options: "i" } },
        ],
      }
    : {};

        //*    Firstly  retrive   all   users   according  to  keyword   regex 
        //*    After   that  filter all user which ids isn't equal to current user..
    const users = await User.find(keyword).find({
      _id:{$ne : req.body._id},
    })
    res.json(users);
});

// const updateProfile = asyncHandler( async( req, res ) => {

// })
module.exports = {
  register,
  login,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassWord,
  fetchAllUsersController
};
