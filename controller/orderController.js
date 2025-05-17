const Orders = require("../modal/order");

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
      res.status(201).json({
        status: true,
        message: `Order is Successfully placed by id ${order.reference}`,
        product: order,
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
};
