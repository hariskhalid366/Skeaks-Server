const express = require("express");
const http = require("http"); // Required for serverless-http with socket.io
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const serverless = require("serverless-http");

const authRouter = require("../../routes/auth");
const userRouter = require("../../routes/user");
const orderRouter = require("../../routes/order");
const productRouter = require("../../routes/product");
const paymentRouter = require("../../routes/paymentIntent");
const taskRouter = require("../../routes/tasks");
const bidRouter = require("../../routes/bid");

const errorHandler = require("../../middleware/errorHandler");

// Load environment variables
dotenv.config();

const app = express();
// NOTE: We will create the HTTP server instance inside the handler function
// for serverless-http, especially when Socket.IO is involved.

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
// It's important to call errorHandler before your routes if it's a generic error handler.
// However, if it's a final error handler (e.g., for unhandled routes or errors passed via next()),
// it should be after your routes. Given its name, assuming it's a generic one for now.
// If it's a final handler, this placement might need adjustment.
// app.use(errorHandler); // We will register this later if it's a final handler

// Adjust paths for routes and middleware based on the new file location
app.use("/api", authRouter); // This base path might be redundant due to Netlify redirects
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/products", productRouter);
app.use("/payment", paymentRouter);
app.use("/tasks", taskRouter);
app.use("/api/bid", bidRouter);

// Error handler middleware - place it after all routes
app.use(errorHandler);


// Separate mongoose connection logic to ensure it's called appropriately
let conn = null;
const MONGO_URL = process.env.MONGO_URL;

async function connectToDatabase() {
  if (conn == null) {
    console.log("Creating new MongoDB connection...");
    try {
      conn = await mongoose.connect(MONGO_URL, {
        serverSelectionTimeoutMS: 5000 // Optional: Adjust timeout
      });
      console.log("✅ MongoDB connected");
      return conn;
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      // Rethrow or handle as appropriate for your application
      throw err;
    }
  } else {
    console.log("Using existing MongoDB connection.");
  }
  return conn;
}

const BidProduct = require("../../modals/bidModal");

// Create the HTTP server and Socket.IO instance *outside* the main handler
// to allow connection reuse if the function instance is warm.
// However, for true serverless, this might need to be within the handler or managed differently.
// Netlify's current WebSocket support might handle this more gracefully.

// We will initialize the server and io within the handler for `serverless-http`
// or rely on Netlify's native WebSocket handling.

// For serverless-http, we typically don't listen on a port.
// The listening part will be handled by serverless-http.

// The main handler function for Netlify
exports.handler = async (event, context) => {
  // Ensure database connection
  await connectToDatabase();

  // Create a new HTTP server for each invocation if not already created,
  // or reuse if possible. For serverless-http, it wraps the app.
  // For Socket.IO, we need to ensure it's correctly initialized.

  // If we are using serverless-http, it handles the server creation and listening.
  // We need to ensure Socket.IO is attached to the server `serverless-http` uses or creates.
  // A common pattern is to create the server and io instance once, globally,
  // and then pass the app to serverless-http.

  // Let's refine the Socket.IO setup for serverless-http.
  // serverless-http can take an Express app, but for Socket.IO,
  // it needs to be attached to an http.Server instance.
  // Some examples show creating the server and io instance globally.

  if (!global.httpServer) {
    console.log("Creating new HTTP server and Socket.IO instance for serverless function");
    global.httpServer = http.createServer(app); // Pass the app to createServer
    global.io = new Server(global.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      // It's often necessary to specify the path for Socket.IO in serverless environments
      // if it's not running at the root of the function's URL.
      // path: "/api/socket.io" // Example, adjust if your Netlify function path is different
    });

    global.io.on("connection", (socket) => {
      console.log("🔌 New socket connection:", socket.id);

      socket.on(
        "new-bid",
        async ({ productId, userId, username, avatar, amount }) => {
          try {
            // Ensure DB is connected for this operation
            await connectToDatabase();
            const product = await BidProduct.findById(productId);
            if (!product || new Date() > new Date(product.bidEndTime)) {
              console.log(`Bid attempt on expired or non-existent product: ${productId}`);
              return;
            }

            product.currentBid = { amount, userId };
            product.bids.push({ userId, username, avatar, amount });
            await product.save();
            console.log(`Bid saved for product ${productId} by user ${username}`);
            global.io.emit("bid-updated", { productId, amount, username, avatar });
          } catch (err) {
            console.error("Socket error in new-bid:", err);
          }
        }
      );

      socket.on("disconnect", () => {
        console.log("🚪 User disconnected:", socket.id);
      });
    });
  } else {
    console.log("Using existing HTTP server and Socket.IO instance.");
  }

  // Use serverless-http to wrap the app, but pass the server for Socket.IO
  // serverless-http can also take an http.Server instance.
  const handler = serverless(global.httpServer); // Pass the server instance
  return handler(event, context);
};

// Remove the original server.listen, as Netlify handles this.
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
