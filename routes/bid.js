const router = require("express").Router();
const bidController = require("../controllers/bidController");

router.post("/post", bidController.postProductForBid);
router.get("/active", bidController.getActiveBidProducts);
router.get("/mine/:userId", bidController.getUserBidProducts);
router.get("/participated/:userId", bidController.getUserParticipatedBids);
router.get("/:productId", bidController.getBidProductById);

module.exports = router;
