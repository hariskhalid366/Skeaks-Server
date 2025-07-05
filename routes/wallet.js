const router = require("express").Router();
const walletController = require("../controllers/walletController");
const { verifyToken } = require("../middleware/jwt_token");

// GET /api/wallet/ - Get the authenticated user's wallet balance
router.get("/", verifyToken, walletController.getWalletBalance);

// Other wallet-related routes could be added here if needed in the future,
// e.g., transaction history, deposit/withdrawal (though these are complex and not in scope).

module.exports = router;
