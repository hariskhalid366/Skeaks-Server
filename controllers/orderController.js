const Orders = require("../modals/order");
const sendEmail = require("../utils/sendEmail.js");
const { paginate } = require('../utils/pagination');

module.exports = {
  createOrder: async (req, res, next) => {
    const newOrders = new Orders({
      id: req.body.id,
      username: req.body.username,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      date: new Date(),
      paymentMethod: req.body.paymentMethod,
      payment: req.body.payment,
      product: req.body.product.flat(),
      reference: req.body.reference,
    });
    try {
      const order = await newOrders.save();

      const productList = order.product
        .map((item, index) => {
          return `\n${index + 1}. ${item.name} - ${item.price}`;
        })
        .join("");

      res.status(201).json({
        status: true,
        message: `Order is Successfully placed by id ${order.reference}`,
        product: order,
      });

      await sendEmail({
        to: order.email,
        subject: `Your Order ${order.reference} Confirmation`,
        text: `Hi ${order.username},\n\nThank you for your purchase!\n\nOrder Reference: ${order.reference}\n\nProducts:\n${productList}\n\nTotal Payment: ${order.payment}\n\nWe will ship your order to:\n${order.address}\n\n- Skeaks Team`,
      });
    } catch (error) {
      return next(error);
    }
  },

  findOrder: async (req, res, next) => {
    try {
      const order = await Orders.findOne({ reference: req.body.reference });

      if (!order) {
        return res
          .status(401)
          .json({ status: false, message: "Order not found" });
      }

      res.status(200).json({ status: true, id: order.id, order: order });
    } catch (error) {
      return next(error);
    }
  },

  findOrdersByEmail: async (req, res, next) => {
    try {
      const { email } = req.query;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      if (!email) {
        return res.status(400).json({
          status: false,
          message: "Email is required to find user orders",
        });
      }

      const query = Orders.find({ email });
      const paginatedResults = await paginate(query, page, limit);

      if (!paginatedResults.data || paginatedResults.data.length === 0) {
        return res.status(404).json({
          status: false,
          message: "No orders found for this email",
        });
      }

      res.status(200).json({ status: true, ...paginatedResults });
    } catch (error) {
      return next(error);
    }
  },
};
