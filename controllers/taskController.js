const task = require("../modals/task");

module.exports = {
  getUserTasks: async (req, res, next) => {
    try {
      const tasks = await task.find();

      if (!tasks || tasks.length === 0) {
        return res
          .status(404)
          .json({ status: false, message: "No tasks found" });
      }

      res.status(200).json({ status: true, tasks });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      return next(error);
    }
  },
  completeTask: async (req, res, next) => {
    try {
      const { taskId } = req.body;

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
