const User = require("../modal/users");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

module.exports = {
  createUser: async (req, res, next) => {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      phonenumber: req.body.phonenumber,
      password: CryptoJS.AES.encrypt(
        req.body.password,
        process.env.SECRET
      ).toString(),
    });
    try {
      const userData = await newUser.save();
      res.status(201).json({
        status: true,
        message: "Your account is created successfully",
        user: userData,
      });
    } catch (error) {
      return next(error);
    }
  },
  loginUser: async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res
          .status(401)
          .json({ status: false, message: "User not found" });
      }

      const decryptedPassword = CryptoJS.AES.decrypt(
        user.password,
        process.env.SECRET
      );
      const decryptedString = decryptedPassword.toString(CryptoJS.enc.Utf8);

      if (decryptedString !== req.body.password) {
        return res
          .status(401)
          .json({ status: false, message: "Incorrect Password" });
      }

      const userToken = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.status(200).json({
        status: true,
        user,
        token: userToken,
      });
    } catch (error) {
      return next(error);
    }
  },
};
