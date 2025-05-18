const router = require("express").Router();
const orderController = require("../controllers/orderController");

router.post("/order", orderController.createOrder);
router.post("/findorder", orderController.findOrder);
router.get("/userorders", orderController.findOrdersByEmail);

module.exports = router;
