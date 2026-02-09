const express=require("express");
const router=express.Router();
const upload = require("../middleware/uploadAvatarMiddleware");

const {empList, assignEmployee, unassignEmployee, addEmployee, getEmployeeTasks}=require('../controllers/adminController');

router.get('/emp-list',empList);
router.post('/assign-employee/:id',assignEmployee); //give supervisor id
router.post('/unassign-employee/:id',unassignEmployee); //give supervisor id
router.post('/add-employee',upload.single('avatar'),addEmployee);
router.get('/get-employee-tasks',getEmployeeTasks);
module.exports=router;