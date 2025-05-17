const router = require("express").Router();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// router endpoints
router.post("/intents", async (req, res) => {
  try {
    // create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });
    // Return the secret
    res.json({
      paymentIntent: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLIC_KEY,
    });
  } catch (e) {
    res.status(400).json({
      error: e.message,
    });
  }
});

module.exports = router;
