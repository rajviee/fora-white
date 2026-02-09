const express=require('express');
const router=express.Router();
const {unreadCount, getAllNotifications, handleTaskApproval}= require('../controllers/notificationController');
router.get('/getAllNotifications/',getAllNotifications);
router.get('/unreadCount',unreadCount);
router.patch('/handleTaskApproval/:id',handleTaskApproval)


module.exports=router;