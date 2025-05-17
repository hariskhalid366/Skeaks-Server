const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, require: true },
  email: { type: String, require: true, unique: true },
  phonenumber: { type: String },
  password: { type: String, require: true },
  profile: {
    type: Buffer,
    default:
      "https://e7.pngegg.com/pngimages/136/22/png-clipart-user-profile-computer-icons-girl-customer-avatar-angle-heroes-thumbnail.png",
  },
});

module.exports = mongoose.model("User", userSchema);
