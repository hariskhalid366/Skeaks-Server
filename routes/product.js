const router = require("express").Router();
const productController = require("../controllers/productController");

router.get("/data", productController.getAllProducts);
router.get("/search", productController.searchProductsByName);
router.get("/:productId", productController.getProductById);

module.exports = router;
