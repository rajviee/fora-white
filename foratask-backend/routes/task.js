const express = require("express");
const router = express.Router();
const { createTask, getTask,createSubTask,deleteTask,getTaskList, deleteDocument, editTask, searchTasks, markAsCompleted } = require("../controllers/taskController");
const upload = require("../middleware/uploadMiddleware");

router.post("/add-task" ,upload.array("file", 3), createTask);
router.post("/add-sub-task", createSubTask);
router.get('/getTaskList',getTaskList)
router.delete('/delete-task/:id',deleteTask);
// router.patch('/update/:id',updateStatus);
router.patch('/markAsCompleted', markAsCompleted);
router.delete('/:id/documents/:docId',deleteDocument);
router.patch('/edit/:id',upload.array("file",3),editTask);
router.get('/search',searchTasks);
router.get('/:id',getTask);
module.exports = router;