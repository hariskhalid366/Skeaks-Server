const task = require("../modals/task");
const { paginate } = require("../utils/pagination");

module.exports = {
  getUserTasks: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const query = task.find();
      const paginatedResults = await paginate(query, page, limit);

      if (!paginatedResults.data || paginatedResults.data.length === 0) {
        return res
          .status(404)
          .json({ status: false, message: "No tasks found" });
      }

      res.status(200).json({ status: true, ...paginatedResults });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      return next(error);
    }
  },
  completeTask: async (req, res, next) => {
    try {
      const { taskId } = req.body;

      console.log("Completing task with ID:", taskId);

      const updatedTask = await task.findByIdAndUpdate(
        taskId,
        { status: true },
        { new: true }
      );

      if (!updatedTask) {
        return res
          .status(404)
          .json({ status: false, message: "Task not found" });
      }

      res.status(200).json({
        status: true,
        message: "Task marked as completed",
        task: updatedTask,
      });
    } catch (error) {
      console.error("Error completing task:", error);
      return next(error);
    }
  },
};
