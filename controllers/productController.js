const Product = require("../modals/product");
const { paginate } = require("../utils/pagination");

const getProductById = async (id) => {
  return Product.findById(id);
};

module.exports = {
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
      const product = await getProductById(productId);

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
