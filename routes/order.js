const router = require("express").Router();
const orderController = require("../controller/orderController");

router.post("/order", orderController.createOrder);
router.post("/findorder", orderController.findOrder);

module.exports = router;
