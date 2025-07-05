const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Primary image
  images: [{ type: String }], // Array of image URLs
  price: { type: Number, required: true }, // Used for fixed price items
  sizes: [{ type: String }], // Array of available sizes, if applicable
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isFixedPrice: {
    type: Boolean,
    required: true,
    default: true, // True for direct buy, false if it's an auction item (which might have more details in BidProduct)
  },
  // If isFixedPrice is false, this product might also be represented in the BidProduct collection
  // with more auction-specific details like startingPrice, bidEndTime, etc.
  status: {
    type: String,
    enum: ["available", "sold", "removed"],
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` field before saving
productSchema.pre('save', function(next) {
  if (this.isModified()) { // only update if something changed
    this.updatedAt = Date.now();
  }
  next();
});

// Ensure 'products' collection name is used, as it was before
module.exports = mongoose.model("products", productSchema);
