const Product = require("../modal/product");

const getProductById = async (id) => {
  return Product.findById(id);
};

module.exports = {
  getAllProducts: async (req, res, next) => {
    try {
      const data = await Product.find();
      if (!data || data.length === 0) {
        return res
          .status(404)
          .json({ status: false, message: "No data found" });
      }
      res.status(200).json({ status: true, products: data });
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
};
