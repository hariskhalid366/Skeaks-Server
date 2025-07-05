const User = require("../modals/users");
const Product = require("../modals/product"); // Corrected model name from schema
const BidProduct = require("../modals/bidModal");

module.exports = {
  deleteUser: async (req, res, next) => {
    try {
      // Consider also removing user's products, bids, etc., or handle that separately.
      await User.findByIdAndDelete(req.user.id);
      // Also, if there's a Wallet, it should likely be handled (e.g., archived or deleted if empty)
      return res.status(200).json({
        status: true,
        message: "Your account has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return next(error);
    }
  },

  // Gets the currently authenticated user's profile
  getOwnProfile: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select(
        "-password -otp -otpExpiry -__v"
      ); // Exclude sensitive fields
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found.",
        });
      }
      res.status(200).json({ status: true, user });
    } catch (error) {
      console.error("Error fetching own profile:", error);
      return next(error);
    }
  },

  // Gets any user's public profile by their ID
  getUserById: async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId).select(
        "-password -otp -otpExpiry -isVerified -__v -phonenumber -walletAddress" // More extensive exclusion for public profiles
      );
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found.",
        });
      }
      res.status(200).json({ status: true, user });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return next(error);
    }
  },

  // Gets products listed by a specific user
  getUserListedProducts: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const products = await Product.find({
        ownerId: userId,
        status: "available", // Only show available products
      }).select("-__v -updatedAt"); // Exclude some fields for brevity if needed

      if (!products) {
        // find returns [] if no documents match, so check length
        return res.status(200).json({ status: true, products: [] });
      }
      res.status(200).json({ status: true, products });
    } catch (error) {
      console.error("Error fetching user listed products:", error);
      return next(error);
    }
  },

  // Gets bidding products created by a specific user
  getUserBiddingProducts: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      // Assuming BidProduct stores creator's ID directly
      const biddingProducts = await BidProduct.find({
        "creator.userId": userId,
      }).select("-__v");

      if (!biddingProducts) {
        return res.status(200).json({ status: true, biddingProducts: [] });
      }
      res.status(200).json({ status: true, biddingProducts });
    } catch (error) {
      console.error("Error fetching user bidding products:", error);
      return next(error);
    }
  },
};
