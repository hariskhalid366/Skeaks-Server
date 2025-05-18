const router = require("express").Router();
const taskController = require("../controllers/taskController");

router.get("/getTasks", taskController.getUserTasks);
router.post("/complete", taskController.completeTask);

module.exports = router;
