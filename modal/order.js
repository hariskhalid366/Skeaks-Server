const mongoose = require("mongoose");

const productOrder = new mongoose.Schema({
  id: { type: String, require: true },
  username: { type: String, require: true },
  email: { type: String, require: true },
  phoneNumber: { type: String, require: true },
  address: { type: String, require: true },
  date: { type: String },
  paymentMethod: { type: String, require: true },
  payment: { type: String, require: true },
  product: { type: Array, require: true },
  reference: {
    type: String,
    default: (Math.random() + 2).toString(36).substring(7),
  },
});

module.exports = mongoose.model("Orders", productOrder);
