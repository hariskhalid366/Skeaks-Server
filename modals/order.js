const mongoose = require("mongoose");

const productOrder = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  payment: { type: String, required: true },
  product: { type: Array, required: true },
  reference: {
    type: String,
    default: (Math.random() + 2).toString(36).substring(7),
  },
});

module.exports = mongoose.model("Orders", productOrder);
