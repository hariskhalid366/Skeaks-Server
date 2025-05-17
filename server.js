const express = require("express");
const app = express();
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const orderRouter = require("./routes/order");
const productRouter = require("./routes/product");
const paymentRouter = require("./routes/paymentIntent");

dotenv.config();
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => console.log(err));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(errorHandler);
app.use("/api", authRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/products", productRouter);
app.use("/payment", paymentRouter);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(process.env.PORT, () =>
  console.log(`App listening on port ${process.env.PORT}!`)
);
