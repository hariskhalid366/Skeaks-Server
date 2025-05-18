const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  platform: { type: String, required: true },
  target: { type: String, required: true },
  description: { type: String, required: true },
  points: { type: Number },
  status: { type: Boolean, default: false },
});

module.exports = mongoose.model("tasks", taskSchema);
