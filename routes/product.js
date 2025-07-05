const router = require("express").Router();
const productController = require("../controllers/productController");
const { verifyToken } = require("../middleware/jwt_token");

// Public routes for viewing products
router.get("/data", productController.getAllProducts); // Consider renaming to /all or /
router.get("/search", productController.searchProductsByName);
router.get("/:productId", productController.getProductById);

// Authenticated routes for creating and deleting products
router.post("/", verifyToken, productController.createProduct); // POST to /api/products/
router.delete("/:productId", verifyToken, productController.deleteProduct); // DELETE /api/products/:productId

module.exports = router;
