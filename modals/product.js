const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  image: { type: String, required: true },
  images: { type: Array, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  sizes: { type: Array, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model("products", productSchema);
