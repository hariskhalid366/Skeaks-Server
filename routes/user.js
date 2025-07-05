const router = require("express").Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/jwt_token");

// Route to delete the authenticated user's account
router.delete("/", verifyToken, userController.deleteUser);

// Route to get the authenticated user's own profile
router.get("/profile/me", verifyToken, userController.getOwnProfile); // Changed from GET /

// Route to get any user's public profile by ID
router.get("/:userId", userController.getUserById);

// Route to get products listed by a specific user
router.get("/:userId/products", userController.getUserListedProducts);

// Route to get bidding products created by a specific user
router.get("/:userId/bids", userController.getUserBiddingProducts);

module.exports = router;
