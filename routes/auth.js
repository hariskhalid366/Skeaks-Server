const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);
router.post("/verify-otp", authController.verifyOtp);
router.post("/google-login", authController.googleLogin);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPasswordWithOtp);
router.patch("/update-wallet", authController.updateWalletAddress);
router.patch("/update-user", authController.updateUserData);

module.exports = router;
