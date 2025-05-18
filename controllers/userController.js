const User = require("../modals/users");

module.exports = {
  deleteUser: async (req, res, next) => {
    try {
      await User.findByIdAndDelete(req.user.id);
      return res.status(200).json({
        status: true,
        message: "Your account is deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
  getUser: async (req, res, next) => {
    const user_Id = req.user.id;
    console.log(user_Id);

    try {
      const user = User.findById(
        { user_Id },
        { password: 0, __v: 0, createdAt: 0, updatedAt: 0 }
      );
      if (!user) {
        return res.status(401).json({
          status: false,
          message: "User does not exists",
        });
      }

      res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  },
};
