const mongoose = require("mongoose");

const bidProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  startingPrice: Number,
  currentBid: {
    amount: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  bidEndTime: Date,
  creator: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
    avatar: String,
  },
  bids: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      avatar: String,
      amount: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("BidProduct", bidProductSchema);
