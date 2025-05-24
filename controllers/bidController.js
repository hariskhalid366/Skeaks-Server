const BidProduct = require("../modals/bidModal");
const { paginate } = require('../utils/pagination');

exports.postProductForBid = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

exports.getActiveBidProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const now = new Date();
    const query = BidProduct.find({ bidEndTime: { $gt: now } });
    const paginatedResults = await paginate(query, page, limit);

    if (!paginatedResults.data || paginatedResults.data.length === 0) {
      return res.status(404).json({ status: false, message: "No active bid products found" });
    }
    res.status(200).json({ status: true, ...paginatedResults });
  } catch (error) {
    next(error);
  }
};

exports.getUserBidProducts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const query = BidProduct.find({ "creator.userId": userId });
    const paginatedResults = await paginate(query, page, limit);

    if (!paginatedResults.data || paginatedResults.data.length === 0) {
      return res.status(404).json({ status: false, message: "No bid products found for this user" });
    }
    res.status(200).json({ status: true, ...paginatedResults });
  } catch (error) {
    next(error);
  }
};

exports.getUserParticipatedBids = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const query = BidProduct.find({ "bids.userId": userId });
    const paginatedResults = await paginate(query, page, limit);

    if (!paginatedResults.data || paginatedResults.data.length === 0) {
      return res.status(404).json({ status: false, message: "No bids participated in by this user" });
    }
    res.status(200).json({ status: true, ...paginatedResults });
  } catch (error) {
    next(error);
  }
};
