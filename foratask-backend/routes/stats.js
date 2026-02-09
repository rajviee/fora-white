const express=require("express");
const router=express.Router();
const {todaysTasks, tasksSummary, statisticsGraph}=require('../controllers/statsController.js');

router.get('/tasks-summary',tasksSummary);
router.get('/todaysTasks',todaysTasks);
router.get('/statisticsGraph',statisticsGraph);
module.exports=router;