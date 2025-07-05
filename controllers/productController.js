const Product = require("../modals/product");
const { paginate } = require("../utils/pagination");

// Helper function, remains useful
const getProductByIdInternal = async (id) => {
  return Product.findById(id);
};

module.exports = {
  createProduct: async (req, res, next) => {
    try {
      const { name, description, image, images, price, sizes } = req.body;
      const ownerId = req.user.id; // From verifyToken middleware

      if (!name || !description || !image || !price) {
        return res.status(400).json({
          status: false,
          message:
            "Missing required fields: name, description, image, price.",
        });
      }

      const newProduct = new Product({
        name,
        description,
        image,
        images: images || [],
        price,
        sizes: sizes || [],
        ownerId,
        isFixedPrice: true, // Explicitly for this API
        status: "available",
      });

      await newProduct.save();
      res
        .status(201)
        .json({ status: true, message: "Product listed successfully", product: newProduct });
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({ status: false, message: error.message });
      }
      return next(error);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const userId = req.user.id;

      const product = await Product.findById(productId);

      if (!product) {
        return res
          .status(404)
          .json({ status: false, message: "Product not found." });
      }

      if (product.ownerId.toString() !== userId) {
        return res.status(403).json({
          status: false,
          message: "You are not authorized to delete this product.",
        });
      }

      // Soft delete by changing status to 'removed'
      product.status = "removed";
      product.updatedAt = Date.now();
      await product.save();
      // OR Hard delete: await Product.findByIdAndDelete(productId);

      res
        .status(200)
        .json({ status: true, message: "Product removed successfully." });
    } catch (error) {
      console.error("Error deleting product:", error);
      return next(error);
    }
  },

  getAllProducts: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const query = Product.find();
      const paginatedResults = await paginate(query, page, limit);

      if (!paginatedResults.data || paginatedResults.data.length === 0) {
        return res
          .status(404)
          .json({ status: false, message: "No data found" });
      }
      res.status(200).json({ status: true, ...paginatedResults });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  getProductById: async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const product = await getProductByIdInternal(productId); // Use the renamed helper

      if (!product) {
        return res
          .status(404)
          .json({ status: false, message: "Product not found" });
      }

      res.status(200).json({ status: true, product });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  searchProductsByName: async (req, res, next) => {
    try {
      const { name } = req.query;
      console.log(name);

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      if (!name || name.trim() === "") {
        return res
          .status(400)
          .json({ status: false, message: "Search query cannot be empty" });
      }

      const regex = new RegExp(name, "i"); // Case-insensitive search
      const query = Product.find({ name: regex });
      const paginatedResults = await paginate(query, page, limit);

      if (!paginatedResults.data || paginatedResults.data.length === 0) {
        return res
          .status(404)
          .json({ status: false, message: "No matching products found" });
      }

      res.status(200).json({ status: true, ...paginatedResults });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
};
