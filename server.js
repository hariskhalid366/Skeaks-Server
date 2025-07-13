const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const orderRouter = require("./routes/order");
const productRouter = require("./routes/product");
const paymentRouter = require("./routes/paymentIntent");
const taskRouter = require("./routes/tasks");
const bidRouter = require("./routes/bid");
const walletRouter = require("./routes/wallet"); // Import wallet routes

const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(errorHandler);

app.use("/api", authRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter); // Changed base path for consistency
app.use("/api/wallet", walletRouter); // Add wallet routes
app.use("/payment", paymentRouter); // This seems like it should also be /api/payment
app.use("/tasks", taskRouter); // This seems like it should also be /api/tasks
app.use("/api/bid", bidRouter);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const BidProduct = require("./modals/bidModal");

io.on("connection", (socket) => {
  console.log("🔌 New socket connection:", socket.id);

  socket.on(
    "new-bid",
    async ({ productId, userId, username, avatar, amount }) => {
      try {
        const product = await BidProduct.findById(productId);
        if (!product || new Date() > new Date(product.bidEndTime)) return;

        product.currentBid = { amount, userId };
        product.bids.push({ userId, username, avatar, amount });
        await product.save();

        io.emit("bid-updated", { productId, amount, username, avatar });
      } catch (err) {
        console.error("Socket error in new-bid:", err);
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("🚪 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
