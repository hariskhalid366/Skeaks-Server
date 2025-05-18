const BidProduct = require("../modals/bidModal");

exports.postProductForBid = async (req, res) => {
  const {
    name,
    description,
    image,
    startingPrice,
    bidEndTime,
    userId,
    username,
    avatar,
  } = req.body;

  const product = new BidProduct({
    name,
    description,
    image,
    startingPrice,
    bidEndTime,
    creator: { userId, username, avatar },
  });

  await product.save();
  res.status(201).json({ success: true, product });
};

exports.getActiveBidProducts = async (req, res) => {
  const now = new Date();
  const products = await BidProduct.find({ bidEndTime: { $gt: now } });
  res.json(products);
};

exports.getUserBidProducts = async (req, res) => {
  const { userId } = req.params;
  const products = await BidProduct.find({ "creator.userId": userId });
  res.json(products);
};

exports.getUserParticipatedBids = async (req, res) => {
  const { userId } = req.params;
  const products = await BidProduct.find({ "bids.userId": userId });
  res.json(products);
};
