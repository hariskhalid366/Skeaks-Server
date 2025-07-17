const BidProduct = require("../modals/bidModal");
const { paginate } = require("../utils/pagination");

const getProductById = async (id) => {
  return BidProduct.findById(id);
};

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
      return res
        .status(404)
        .json({ status: false, message: "No active bid products found" });
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
      return res.status(404).json({
        status: false,
        message: "No bid products found for this user",
      });
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
      return res.status(404).json({
        status: false,
        message: "No bids participated in by this user",
      });
    }
    res.status(200).json({ status: true, ...paginatedResults });
  } catch (error) {
    next(error);
  }
};

exports.getBidProductById = async (req, res, next) => {
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
};

exports.placeBid = async (req, res, next) => {
  try {
    const { productId, userId, username, avatar, amount } = req.body;

    const product = await BidProduct.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    if (new Date() > new Date(product.bidEndTime)) {
      return res
        .status(400)
        .json({ status: false, message: "Bidding time has ended" });
    }

    product.currentBid = { amount, userId };
    product.bids.push({ userId, username, avatar, amount });
    await product.save();

    res.status(200).json({
      status: true,
      message: "Bid placed successfully",
      updatedBid: { productId, amount, username, avatar },
    });
  } catch (error) {
    console.error("API error in placeBid:", error);
    next(error);
  }
};
