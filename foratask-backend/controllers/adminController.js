const express = require("express");
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt')
const path = require('path');
const mongoose = require('mongoose');
const Task = require('../models/task');

const empList = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 0;
    const perPage = parseInt(req.query.perPage, 10) || 5;
    if ((page && page < 0) || (perPage && perPage < 0)) {
        return res.status(500).json({ error: "Invalid parameters passed" });
    }
    const skip = (page) * perPage;
    const limit = perPage;
    let emplist = null, totalEmp = null;
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Permission denied: You cannot access employee records." });
        }

        const { search } = req.query;
        const filter = { role: { $in: ['employee', 'supervisor'] }, company: req.user.company };

        if (search) {
            const regex = new RegExp(search, 'i'); // case-insensitive
            filter.$or = [
                { email: regex },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $concat: ["$firstName", " ", "$lastName"] },
                            regex: regex
                        }
                    }
                }
            ];
        }
        emplist = await User.find(filter, {
            firstName: 1,
            lastName: 1,
            role: 1,
            email: 1,
            contactNumber: 1,
            designation: 1,
            avatar: 1,
            _id: 1 // exclude _id
        })
            .skip(skip)
            .limit(limit);

        totalEmp = await User.countDocuments(filter);
        if (!emplist || emplist.length === 0) {
            return res.status(404).json({ message: "No employees found" });
        }

        return res.status(200).json({
            employees: emplist,
            totalEmp,
            totalPages: Math.ceil(totalEmp / perPage),
            currentPage: page,
            perPage,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const addEmployee = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Permission denied: You cannot assign employee." });
        }
        console.log(req.body);
        let {
            email,
            password,
            firstName,
            lastName,
            avatar,
            contactNumber,
            dateOfBirth,
            gender,
            role,
            designation,
        } = req.body;

        if (req.file) {
            avatar = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path.replace(/\\/g, '/'),
                size: req.file.size,
                mimeType: req.file.mimetype,
                fileExtension: path.extname(req.file.originalname),
            };
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user
        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            avatar,
            contactNumber,
            dateOfBirth,
            gender,
            role,
            designation,
            company: req.user.company
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully", userId: newUser._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// url --> supervisor id
// body --> employee id
const assignEmployee = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Permission denied: You cannot assign employee." });
        }
        const supervisorId = req.params.id;
        const empToAssign = req.body.id;
        console.log('sup id=', req.params, ' emp id= ', req.body)
        console.log('sup id=', supervisorId, ' emp id= ', empToAssign)
        //user is not admin ==> supervisor does not exist or is a supervisor only, is the id employee only, supervisor is assigning self, supervisor already has that employee assigned
        const isSupervisor = await User.findOne({
            _id: supervisorId, role: 'supervisor'
        });
        const isEmployee = await User.findOne({
            _id: empToAssign, role: 'employee'
        });
        if (!isSupervisor || !isEmployee) {
            return res.status(404).json({ message: "Check your users." });
        }
        if (isEmployee.supervisor) {
            return res.status(409).json({ message: "Remove the supervisor first to assign another" });
        }

        isSupervisor.subordinates.push(empToAssign);
        await isSupervisor.save();

        isEmployee.supervisor = supervisorId;
        await isEmployee.save();

        res.status(200).json({ message: 'Employee assigned to supervisor successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// url --> supervisor id
// body --> employee id

const unassignEmployee = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Permission denied: You cannot unassign employee." });
        }
        // if admin => check if emp id has supervisor, remove supervisor and from supervisor's id remove the emp id from subordinates
        const supervisorId = req.params.id;
        const employeeId = req.body.id;

        const isSupervisor = await User.findOne({
            _id: supervisorId, role: 'supervisor'
        });
        const isEmployee = await User.findOne({
            _id: employeeId, role: 'employee'
        });

        if (!isSupervisor || !isEmployee) {
            return res.status(404).json({ message: "Check your users." });
        }

        if (isEmployee.supervisor?.toString() !== supervisorId) {
            return res.status(400).json({ message: 'Employee is not assigned to this supervisor.' });
        }

        // Remove supervisor reference from employee
        isEmployee.supervisor = null;
        await isEmployee.save();

        // Remove employeeId from supervisor's subordinates
        isSupervisor.subordinates = isSupervisor.subordinates.filter(
            id => id.toString() !== employeeId
        );
        await isSupervisor.save();

        return res.status(200).json({ message: 'Employee unassigned successfully.' });

    }
    catch (err) {
        res.status(500).json({ erorr: err.message });
    }
}

const getEmployeeTasks = async (req, res) => {
    try {
        const role = req.user.role;
        console.log(role);
        if(role !=="admin"){
            return res.status(403).json({message: "You are not allowed to view employee records"})
        }
        const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;
        if (isSelfTask === null) return res.status(400).json({ message: "Invalid value for isSelfTask. Must be 'true' or 'false'." });

        const user = new mongoose.Types.ObjectId(req.query.targetUser);
        const companyId = new mongoose.Types.ObjectId(req.user.company);
        const page = parseInt(req.query.page, 10) || 0;
        const perPage = parseInt(req.query.perPage, 10) || 10;

        if ((page && page < 0) || (perPage && perPage < 0)) {
           return res.status(500).json({ error: "Invalid parameters passed" });
        }

        const skip = (page) * perPage;
        const limit = perPage;

          const statusFilter = req.query.status
            ? { status: { $in: req.query.status.split(',') } }
            : {};


        const search = req.query.search ? req.query.search.trim() : null;
        const titleFilter = search ? { title: { $regex: search, $options: 'i' } } : {};

        const selectOptions = {
            _id: 1,
            title: 1,
            description: 1,
            assignees: 1,
            observers: 1,
            priority: 1,
            dueDateTime: 1,
            status: 1,
            createdAt: 1,
        };
         const isValidDate = (date) => {
            return date instanceof Date && !isNaN(date.getTime());
        };

        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
        const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

        if (fromDate && !isValidDate(fromDate)) {
            return res.status(400).json({ message: "Invalid fromDate" });
        }
        if (toDate && !isValidDate(toDate)) {
            return res.status(400).json({ message: "Invalid toDate" });
        }


        // ✅ NEW: Build date range condition
        const dateCondition = {};
        if (fromDate && toDate) {
            dateCondition.dueDateTime = { $gte: fromDate, $lte: toDate };
        } else if (fromDate) {
            dateCondition.dueDateTime = { $gte: fromDate };
        } else if (toDate) {
            dateCondition.dueDateTime = { $lte: toDate };
        }

        let tasks = null, totalTasks = null;

        if (isSelfTask) {
            tasks = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        ...dateCondition,
                        ...statusFilter,
                        ...titleFilter,
                        company: companyId,
                        createdBy: user
                    }
                },
                {
                    $addFields: {
                        priorityOrder: {
                            $indexOfArray: [["High", "Medium", "Low"], "$priority"]
                        },
                        statusOrder: {
                            $indexOfArray: [["Overdue", "For Approval", "In Progress", "Pending", "Completed"], "$status"]
                        }
                    }
                },
                {
                    $sort: {
                        statusOrder: 1,
                        priorityOrder: 1,
                        dueDateTime: 1,
                    }
                },

                { $project: selectOptions },
                { $skip: skip },
                { $limit: limit }
            ]);
            totalTasks = await Task.countDocuments({
                isSelfTask: isSelfTask, createdBy: user, ...dateCondition,
                ...statusFilter, ...titleFilter, company: companyId
            });
        }
        else {
            tasks = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        ...dateCondition,
                        ...statusFilter,
                        ...titleFilter,
                        company: companyId,
                        $or: [
                            { assignees: user },
                            { observers: user },
                            { createdBy: user }
                        ],
                    }
                },
                {
                    $addFields: {
                        priorityOrder: {
                            $indexOfArray: [["High", "Medium", "Low"], "$priority"]
                        },
                        statusOrder: {
                            $indexOfArray: [["Overdue", "For Approval", "In Progress", "Pending", "Completed"], "$status"]
                        }
                    }
                },
                {
                    $sort: {
                        statusOrder: 1,
                        priorityOrder: 1,
                        dueDateTime: 1,
                    }
                },
                { $project: selectOptions },
                { $skip: skip },
                { $limit: limit }
            ]);
            totalTasks = await Task.countDocuments({
                isSelfTask: isSelfTask, ...dateCondition,
                ...statusFilter, ...titleFilter, company: companyId,
                 $or: [
                            { assignees: user },
                            { observers: user },
                            { createdBy: user }
                        ],
            });
            console.log("totalTasks", totalTasks);

        }
        if (tasks != null && totalTasks != null) {
            return res.status(200).json({
                tasks,
                totalTasks,
                totalPages: Math.ceil(totalTasks / perPage),
                currentPage: page,
                perPage,
            });
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}


module.exports = { empList, assignEmployee, unassignEmployee, addEmployee, getEmployeeTasks };
