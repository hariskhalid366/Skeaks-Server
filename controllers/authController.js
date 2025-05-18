const User = require("../modals/users");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail.js");

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function generateOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 mins
  return { otp, otpExpiry: new Date(expiry) };
}

module.exports = {
  createUser: async (req, res, next) => {
    try {
      const { username, email, phonenumber, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ status: false, message: "Email already in use" });
      }

      const { otp, otpExpiry } = generateOtp();

      const newUser = new User({
        username,
        email,
        phonenumber,
        password: CryptoJS.AES.encrypt(password, process.env.SECRET).toString(),
        otp,
        otpExpiry,
        isVerified: false,
      });

      await newUser.save();
      await sendEmail(email, "OTP Verification", `Your OTP is: ${otp}`);

      res.status(201).json({
        status: true,
        message: "User created. OTP sent to email. Please verify to continue.",
      });
    } catch (error) {
      next(error);
    }
  },

  verifyOtp: async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      if (user.isVerified) {
        return res
          .status(400)
          .json({ status: false, message: "User already verified" });
      }

      if (user.otp !== otp || Date.now() > new Date(user.otpExpiry).getTime()) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid or expired OTP" });
      }

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      const token = generateToken(user._id);
      user.password = undefined;

      res.status(200).json({
        status: true,
        message: "Account verified successfully",
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  loginUser: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(401)
          .json({ status: false, message: "User not found" });
      }

      if (!user.isVerified) {
        const { otp, otpExpiry } = generateOtp();
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendEmail(email, "OTP Verification", `Your OTP is: ${otp}`);
        return res.status(403).json({
          status: false,
          message:
            "Please verify your account with the OTP sent to your email.",
        });
      }

      const decrypted = CryptoJS.AES.decrypt(user.password, process.env.SECRET);
      const decryptedPassword = decrypted.toString(CryptoJS.enc.Utf8);

      if (decryptedPassword !== password) {
        return res
          .status(401)
          .json({ status: false, message: "Incorrect password" });
      }

      user.password = undefined;
      const token = generateToken(user._id);

      res.status(200).json({ status: true, user, token });
    } catch (error) {
      next(error);
    }
  },

  googleLogin: async (req, res, next) => {
    try {
      const { email, username, phonenumber = "" } = req.body;

      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          username,
          email,
          phonenumber,
          isVerified: true,
          password: CryptoJS.AES.encrypt(
            email + process.env.SECRET,
            process.env.SECRET
          ).toString(),
        });
        await user.save();
      }

      user.password = undefined;
      const token = generateToken(user._id);

      res.status(200).json({ status: true, user, token });
    } catch (error) {
      next(error);
    }
  },

  updateWalletAddress: async (req, res, next) => {
    try {
      const { userId, walletAddress } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { walletAddress },
        { new: true }
      ).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      res.status(200).json({ status: true, user });
    } catch (error) {
      next(error);
    }
  },

  updateUserData: async (req, res, next) => {
    try {
      const { userId, username, location, phonenumber, profile } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...(username && { username }),
          ...(location && { location }),
          ...(phonenumber && { phonenumber }),
          ...(profile && { profile }),
        },
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      res.status(200).json({ status: true, user: updatedUser });
    } catch (error) {
      next(error);
    }
  },

  requestPasswordReset: async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      const { otp, otpExpiry } = generateOtp();
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await sendEmail(email, "Your OTP Code", `Your OTP code is: ${otp}`);
      res.status(200).json({ status: true, message: "OTP sent to email" });
    } catch (error) {
      next(error);
    }
  },

  resetPasswordWithOtp: async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ email });

      if (
        !user ||
        user.otp !== otp ||
        Date.now() > new Date(user.otpExpiry).getTime()
      ) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid or expired OTP" });
      }

      user.password = CryptoJS.AES.encrypt(
        newPassword,
        process.env.SECRET
      ).toString();
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      res
        .status(200)
        .json({ status: true, message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
  },
};
// This code is a Node.js controller for user authentication and management.
// It includes functions for creating a user, verifying OTP, logging in, Google login,
// updating wallet address, updating user data, requesting password reset, and resetting
// password with OTP.
// The code uses Mongoose for MongoDB interactions, CryptoJS for password encryption,
