const router = require("express").Router();
const productController = require("../controller/productController");

router.get("/data", productController.getAllProducts);
router.get("/:productId", productController.getProductById); // Updated route

module.exports = router;
