const Task = require('../models/task');
const User = require('../models/user');
const path = require("path");
const SubTask = require('../models/subtask');
const Notification = require('../models/notification');
const TaskCompletionHistory = require('../models/taskCompletionHistory');
const mongoose = require('mongoose');
const fs = require("fs");
const { sendPushNotification, sendBulkPushNotifications } = require('./notificationController');
const { title } = require('process');
const createTask = async (req, res) => {
    try {
        const documents = (req.files || []).map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimeType: file.mimetype,
            fileExtension: path.extname(file.originalname),
            uploadedBy: req.user.id,
        }));

        const assignees = Array.isArray(req.body.assignees) ? req.body.assignees : [req.body.assignees].filter(Boolean);
        const observers = Array.isArray(req.body.observers) ? req.body.observers : [req.body.observers].filter(Boolean);
        const selfTask = assignees.length === 1 && observers.length === 1 && assignees[0] === req.user.id && observers[0] === req.user.id;
        const taskData = new Task({
            ...req.body,
            documents,
            createdBy: req.user.id,
            isSelfTask: selfTask,
            assignees: assignees,
            observers: observers,
            company: req.user.company
        });
        if (!taskData.title || taskData.assignees.length < 1 || !taskData.createdBy) {
            return res.status(400).json({ message: 'Fill the required fields.' });
        }

        const repeatOffsets = {
            "10m": 10 * 60 * 1000,
            "30m": 30 * 60 * 1000,
            "1h": 60 * 60 * 1000,
            "1d": 24 * 60 * 60 * 1000,
            "1w": 7 * 24 * 60 * 60 * 1000,
        };

        function computeNotifications(task) {
            const notifications = [];

            // Add fixed reminder
            if (task.reminder) {
                notifications.push({ date: new Date(task.reminder), notifId: null });
            }

            // Add repeat reminders based on dueDateTime
            if (Array.isArray(task.repeatReminder)) {
                task.repeatReminder.forEach(rr => {
                    const offset = repeatOffsets[rr];
                    if (offset && task.dueDateTime) {
                        const reminderDate = new Date(task.dueDateTime.getTime() - offset);
                        notifications.push({ date: reminderDate, notifId: null });
                    }
                });
            }

            return notifications;
        }
        taskData.notification = computeNotifications(taskData);
        const result = await taskData.save();
        if (result) {
            // 1️⃣ Create unique user IDs and their notifications
            const allUserIds = [...new Set([...assignees, ...observers])];

            const notifications = allUserIds.map(userId => {
                const isAssignee = assignees.includes(userId);
                const isObserver = observers.includes(userId);

                let message;
                if (isAssignee && isObserver) {
                    message = `You have been added to task: ${result.title}`;
                } else if (isAssignee) {
                    message = `You have been assigned to task: ${result.title}`;
                } else {
                    message = `You are added as a viewer to task: ${result.title}`;
                }

                return {
                    userId: userId,
                    senderId: req.user.id,
                    taskId: result._id,
                    dueDateTime: result.dueDateTime,
                    message: message,
                    company: req.user.company
                };
            });

            // 2️⃣ Insert DB notifications
            await Notification.insertMany(notifications);

            // 3️⃣ Fetch all relevant users
            const users = await User.find(
                { _id: { $in: allUserIds } },
                { expoPushToken: 1, firstName: 1 }
            );

            // 4️⃣ Send push notifications for each user
            for (const user of users) {
                if (!user.expoPushToken) continue;

                const isAssignee = assignees.includes(user._id.toString());
                const isObserver = observers.includes(user._id.toString());

                let title, message;

                if (isAssignee && isObserver) {
                    title = "Added to Task";
                    message = `You have been added to task: ${result.title}`;
                } else if (isAssignee) {
                    title = "New Task Assigned";
                    message = `You have been assigned to task: ${result.title}`;
                } else if (isObserver) {
                    title = "Task Viewer Update";
                    message = `You are added as a viewer to task: ${result.title}`;
                }

                await sendPushNotification(
                    user.expoPushToken,
                    title,
                    message,
                    "foranotif.wav"
                );
            }
            allUserIds.forEach(userId => {
                const socketId = global.connectedUsers[userId];
                if (socketId) {
                    global.io.to(socketId).emit("taskCreated", {
                        taskId: result._id,
                        title: result.title,
                        dueDateTime: result.dueDateTime,
                        assignees,
                        observers
                    });
                    console.log("taskCreated event sent to:", userId);
                }
            });

            return res.status(200).json({ message: "Notifications inserted & push sent!", task: result, taskId: result._id });
        }
        return res.status(201).json({ message: "New Task saved!", task: result });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSubTask = async (req, res) => {
    try {
        const subTaskData = req.body;
        const { parentTaskId, ...rest } = subTaskData;
        const assignees = req.body.assignees || [];
        const observers = req.body.observers || [];
        const selfTask = assignees.length === 1 && observers.length === 1 && assignees[0] === req.user.id && observers[0] === req.user.id;
        if (!parentTaskId) {
            return res.status(400).json({ error: "parentTaskId is required" });
        }
        const subTask = new SubTask({
            ...subTaskData,
            isSelfTask: selfTask,
            createdBy: req.user.id,
        });
        const result = await subTask.save();

        await Task.findByIdAndUpdate(
            parentTaskId,
            { $set: { subTask: result._id } },
        );
        return res.status(201).json({ message: "Sub Task Saved!", subtask: result });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
}

const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const existingTask = await Task.findById(taskId);
        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (req.user.role !== "admin" && existingTask.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this task" });
        }
        if (existingTask.documents && existingTask.documents.length > 0) {
            for (const doc of existingTask.documents) {
                const filePath = path.join("uploads", path.basename(doc.path));
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (unlinkErr) {
                    console.error(`Error deleting file ${fullPath}:`, unlinkErr.message);
                }
            }
        }
        await Task.findByIdAndDelete(taskId);
        return res.status(200).json({ message: "Task Deleted Successfully!" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const getTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        if (req.user.role == "admin") {
            const task = await Task.findById({ _id: taskId }, { notification: 0 }).populate("assignees", "firstName lastName avatar").populate("observers", "firstName lastName avatar").populate({ path: "documents.uploadedBy", select: "firstName lastName avatar" });
            if (!task) return res.status(404).json({ message: 'Task not found' });
            return res.status(200).json(task);
        }

        const task = await Task.findOne({
            _id: taskId,
            $or: [
                { assignees: req.user.id },
                { observers: req.user.id },
                { createdBy: req.user.id }
            ]
        }, { notification: 0 }).populate("assignees", "firstName lastName avatar").populate("observers", "firstName lastName avatar").populate({ path: "documents.uploadedBy", select: "firstName lastName avatar" });

        if (!task) {
            return res.status(403).json({ message: 'Access denied' });
        }
        let taskObject = task.toObject();
        const isObserver = task.observers
            .map(o => o._id.toString())
            .includes(req.user.id.toString());

        // Should creator see "For Approval" or "Completed"?
         if (!isObserver && task.status == "For Approval") {
            taskObject.status = "Completed";
        }
        return res.status(200).json(taskObject);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// const updateStatus = async (req, res) => {
//     try {
//         const { taskIds, status } = req.body;
//         const userId = req.user.id;
//         const expoNotifications = [];
//         const notifications = [];
//         if (!Array.isArray(taskIds) || !taskIds.length) {
//             return res.status(400).json({ message: "taskIds array is required" });
//         }
//         const uniqueTaskIds = [...new Set(taskIds.map(id => id.toString()))];
//         const allowedStatus = ['Completed', 'In Progress', 'Pending', 'For Approval'];
//         if (!allowedStatus.includes(status)) {
//             return res.status(400).json({ message: "Invalid status value" });
//         }

//         const tasks = await Task.find({
//             _id: { $in: uniqueTaskIds },
//             $or: [
//                 { assignees: userId },
//                 { observers: userId },
//                 { createdBy: userId }
//             ],
//             company: req.user.company
//         });

//         if (tasks.length !== uniqueTaskIds.length) {
//             return res.status(400).json({
//                 message: "Some tasks are invalid or you do not have permission",
//                 requested: uniqueTaskIds.length,
//                 found: tasks.length
//             });
//         }

//         const updatedTasks = [];

//         for (const task of tasks) {
//             console.log(task)
//             const isObserver = task.observers.map(String).includes(userId);
//             const isAssignee = task.assignees.map(String).includes(userId);
//             if ((task.status === "Completed")||(task.status =="For Approval" && !isObserver)) {
//                 return res.status(400).json({ message: "Task is already completed!" });
//             }
//             // ADMIN / OBSERVER / SELF TASK
//             if (req.user.role === "admin" || isObserver || task.isSelfTask) {

//                 const people = await User.find(
//                     {
//                         _id: {
//                             $in: [...task.observers, ...task.assignees],
//                             $ne: userId
//                         },
//                         // expoPushToken: { $nin: [null, ""] }
//                     },
//                     // { expoPushToken: 1 }
//                 );

//                 for (const p of people) {
//                     // Expo notification ONLY if token exists
//                     if (p.expoPushToken) {
//                         expoNotifications.push({
//                             to: p.expoPushToken,
//                             sound: "foranotif.wav",
//                             title: "Task Completed",
//                             body: `${task.title} has been marked as ${task.status}`,
//                             channelId: "default",
//                             data: { type: "system" }
//                         });
//                     }
//                     // In-app notification (token NOT required)
//                     notifications.push({
//                         userId: p._id,
//                         senderId: userId,
//                         taskId: task._id,
//                         type: "system",
//                         message: `${task.title} has been marked as ${task.status}`,
//                         company: req.user.company
//                     });
//                 }

//                 if (task.status === "For Approval" && status === "Completed") {
//                     await Notification.deleteMany({
//                         taskId: task._id,
//                         type: "taskApproval"
//                     });
//                 }

//                 task.status = status;
//             }

//             // EMPLOYEE → SEND FOR APPROVAL
//             else if (status === "Completed" && isAssignee) {
//                 task.status = "For Approval";
//                 const observers = await User.find(
//                     { _id: { $in: task.observers } },
//                     // { expoPushToken: 1 }
//                 );

//                 for (const o of observers) {
//                     if(o.expoPushToken){
//                         expoNotifications.push({
//                             to: o.expoPushToken,
//                             sound: "foranotif.wav",
//                             title: "Task Approval",
//                             body: `${task.title} has been sent to you for approval`,
//                             channelId: "default",
//                             data: { type: "taskApproval" }
//                         });
//                     }
//                     notifications.push({
//                         userId: o._id,
//                         senderId: userId,
//                         taskId: task._id,
//                         type: "taskApproval",
//                         message: `${task.title} has been sent to you for approval`,
//                         action: { options: ["approve", "reject"], chosen: null },
//                         company: req.user.company
//                     })
//                 }
//             }
//             else {
//                 return res.status(403).json({
//                     message: `You are not permitted to change status of this "${task.title}"`
//                 });
//             }

//             await task.save();

//             let responseTask = task.toObject();
//             if (
//                 responseTask.status === "For Approval" &&
//                 req.user.role !== "admin" &&
//                 !isObserver
//             ) {
//                 responseTask.status = "Completed";
//             }

//             updatedTasks.push(responseTask);
//         }

//         if (updatedTasks.length !== uniqueTaskIds.length) {
//             return res.status(500).json({
//                 message: "Task update mismatch detected",
//                 requested: uniqueTaskIds.length,
//                 updated: updatedTasks.length
//             });
//         }
//         if (notifications.length) {
//             await Notification.insertMany(notifications);
//         }
//         if (expoNotifications.length) {
//             await sendBulkPushNotifications(expoNotifications);
//         }
//         res.status(200).json({
//             message: "Tasks status updated successfully",
//             updatedTasks
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

const markAsCompleted = async (req, res) => {
    try {
        const { taskIds } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";
        const updatedTasks = [];
        const expoNotifications = [];
        const notifications = []

        if (!Array.isArray(taskIds) || !taskIds.length) {
            return res.status(400).json({ message: "taskIds array is required" });
        }
        const uniqueTaskIds = [...new Set(taskIds.map(id => id.toString()))];
        const tasks = await Task.find({
            _id: { $in: uniqueTaskIds },
            $or: [
                { assignees: userId },
                { observers: userId },
                { createdBy: userId }
            ],
            company: req.user.company
        });

        if (tasks.length !== uniqueTaskIds.length) {
            return res.status(400).json({
                message: "Some tasks are invalid or you do not have permission",
                requested: uniqueTaskIds.length,
                found: tasks.length
            });
        }

        if (isAdmin) {
            for (const task of tasks) {
                if (task.status == 'Completed') {
                    return res.status(400).json({ message: "Status of completed task cannot be changed again" });
                }
                const people = await User.find(
                    {
                        _id: {
                            $in: [...task.observers, ...task.assignees],
                            $ne: userId
                        },
                    },
                    // { expoPushToken: 1 }
                );
                for (const p of people) {
                    if (p.expoPushToken) {
                        expoNotifications.push({
                            to: p.expoPushToken,
                            sound: "foranotif.wav",
                            title: "Task Completed",
                            body: `${task.title} has been marked as Completed`,
                            channelId: "default",
                            data: { type: "system", taskId: task._id }
                        });
                    }
                    notifications.push({
                        userId: p._id,
                        senderId: userId,
                        taskId: task._id,
                        type: "system",
                        message: `${task.title} has been marked as Completed`,
                        company: req.user.company
                    });
                }

                if (task.status === "For Approval") {
                    await Notification.deleteMany({
                        taskId: task._id,
                        type: "taskApproval"
                    });
                }
                
                // Save completion history for recurring tasks
                if (task.taskType === 'Recurring') {
                    try {
                        await TaskCompletionHistory.createFromTask(task, userId, 'Completed');
                    } catch (historyError) {
                        console.error('Failed to save completion history:', historyError.message);
                    }
                }
                
                task.status = "Completed";
                await task.save();
                updatedTasks.push(task);
            }
        }
        //not admin - either observer or assignee
        else {
            for (const task of tasks) {
                const userIdStr = userId.toString();
                const isObserver = task.observers.map(id => id.toString()).includes(userIdStr);
                const isAssignee = task.assignees.map(id => id.toString()).includes(userIdStr);
                if ((task.status == 'Completed') || (task.status == "For Approval" && !isObserver)) {
                    return res.status(400).json({ message: "Status of completed task cannot be changed again" });
                }
                const people = await User.find(
                    {
                        _id: {
                            $in: [...task.observers, ...task.assignees],
                            $ne: userId
                        },
                        // expoPushToken: { $nin: [null, ""] }
                    },
                    // { expoPushToken: 1 }
                );

                // 🧠 ROLE RESOLUTION (observer > assignee)

                if (isObserver) {
                    for (const p of people) {
                        if (p.expoPushToken) {
                            expoNotifications.push({
                                to: p.expoPushToken,
                                sound: "foranotif.wav",
                                title: "Task Completed",
                                body: `${task.title} has been marked as Completed`,
                                channelId: "default",
                                data: { type: "system", taskId: task._id }
                            });
                        }
                        notifications.push({
                            userId: p._id,
                            senderId: userId,
                            taskId: task._id,
                            type: "system",
                            message: `${task.title} has been marked as Completed`,
                            company: req.user.company
                        });
                    }

                    if (task.status === "For Approval") {
                        await Notification.deleteMany({
                            taskId: task._id,
                            type: "taskApproval"
                        });
                    }

                    // Save completion history for recurring tasks (observer completing)
                    if (task.taskType === 'Recurring') {
                        try {
                            await TaskCompletionHistory.createFromTask(task, userId, 'Completed');
                        } catch (historyError) {
                            console.error('Failed to save completion history:', historyError.message);
                        }
                    }

                    task.status = "Completed";
                    await task.save();
                    updatedTasks.push(task);

                } else if (isAssignee) {
                    if (task.status == "For Approval") {
                        return res.status(400).json({ message: "You cannot update this task!" });
                    }

                    const observers = await User.find(
                        { _id: { $in: task.observers } },
                        { expoPushToken: 1 }
                    );

                    for (const o of observers) {
                        if (o.expoPushToken) {
                            expoNotifications.push({
                                to: o.expoPushToken,
                                sound: "foranotif.wav",
                                title: "Task Approval",
                                body: `${task.title} has been sent to you for approval`,
                                channelId: "default",
                                data: { type: "taskApproval", taskId: task._id }
                            });
                        }
                        notifications.push({
                            userId: o._id,
                            senderId: userId,
                            taskId: task._id,
                            type: "taskApproval",
                            message: `${task.title} has been sent to you for approval`,
                            action: { options: ["approve", "reject"], chosen: null },
                            company: req.user.company
                        })


                    }

                    task.status = "For Approval";
                    await task.save();
                    updatedTasks.push(task);
                }
                else {
                    return res.status(403).json({
                        message: `You are not permitted to change status of "${task.title}"`
                    });
                }

            }
        }
        if (expoNotifications.length) {
            await sendBulkPushNotifications(expoNotifications);
        }

        if (updatedTasks.length !== uniqueTaskIds.length) {
            return res.status(500).json({
                message: "Task update mismatch detected",
                requested: uniqueTaskIds.length,
                updated: updatedTasks.length
            });
        }
        if (notifications.length) {
            await Notification.insertMany(notifications);
        }
        return res.status(200).json({
            message: "Tasks updated successfully",
            updatedTasksCount: updatedTasks.length,
            updatedTasks

        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const getTaskList = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const role = req.user.role;
        const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;
        if (isSelfTask === null) return res.status(400).json({ message: "Invalid value for isSelfTask. Must be 'true' or 'false'." });

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
        console.log('search= ', search)
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
        // role admin and self tasks
        if (isSelfTask) {
            tasks = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        ...dateCondition,
                        ...statusFilter,
                        ...titleFilter,
                        createdBy: userId,
                        company: companyId
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
                isSelfTask: isSelfTask, createdBy: userId, ...dateCondition,
                ...statusFilter, ...titleFilter, company: companyId
            });
        }
        //admin and team tasks
        if (role == 'admin' && isSelfTask == false) {
            console.log('inside role admin and isseltask = false datecondition= ', dateCondition, 'status filter= ', statusFilter, ' titleFilter= ', titleFilter, ' companyId= ', companyId)
            tasks = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        ...dateCondition,
                        ...statusFilter,
                        ...titleFilter,
                        company: companyId
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
            // console.log("tasks", tasks);
            totalTasks = await Task.countDocuments({
                isSelfTask: isSelfTask, ...dateCondition,
                ...statusFilter, ...titleFilter, company: companyId
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
        // where not self task and they are not admin.
        tasks = await Task.aggregate([
            {
                $match: {
                    isSelfTask: isSelfTask,
                    ...dateCondition,
                    ...titleFilter,
                    ...statusFilter,
                    company: companyId,
                    $or: [
                        { assignees: userId },
                        { observers: userId },
                        { createdBy: userId }
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
            {
                $project: selectOptions
            },
            { $skip: skip },
            { $limit: limit }
        ]);
        totalTasks = await Task.countDocuments({
            isSelfTask: isSelfTask,
            ...dateCondition,
            ...statusFilter,
            ...titleFilter,
            company: companyId,
            $or: [
                { assignees: userId },
                { observers: userId },
                { createdBy: userId }
            ]
        })
        const taskList = tasks.map(
            task => {
                let taskObject = task;
                // Same question for creator??? This was again asked at 16/10 5:14PM, but rajvi said not needed.
                if (!taskObject.observers.map(String).includes(userId) && taskObject.status === "For Approval") {
                    taskObject.status = "Completed";
                }
                return taskObject;
            }
        )

        return res.status(200).json({
            tasks: taskList,
            totalTasks,
            totalPages: Math.ceil(totalTasks / perPage),
            currentPage: page,
            perPage,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const deleteDocument = async (req, res) => {
    const docId = req.params.docId;
    const userId = req.user.id;
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    // find document to delete

    const doc = task.documents.id(docId);

    if (!doc) return res.status(404).json({ message: "Document not found" });
    // delete file from local storage (optional)
    const filePath = path.join("uploads", path.basename(doc.path));

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // deletes the file
    }

    // remove from database
    doc.deleteOne();
    await task.save();

    res.status(200).json({ message: "Document deleted from task and storage" });
}

const editTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const role = req.user.role;
        const task = await Task.findOne({ _id: taskId, company: req.user.company });

        if (!task) {
            return res.status(404).json({
                message: "Task not found."
            });
        }
        const oldAssignees = task.assignees.map(id => id.toString());
        const oldObservers = task.observers.map(id => id.toString());

        let allowedFields = [];
        const isSelfTask = task.isSelfTask;
        const isAssignee = task.assignees?.map(String).includes(userId.toString());
        const isObserver = task.observers?.map(String).includes(userId.toString());
        const isCreator = task.createdBy?.toString() === userId.toString();
        const isAdmin = (role === 'admin');
        console.log('going to edit task')
        const filteredUpdate = {};
        console.log('isSelfTask', isSelfTask, 'isAssignee', isAssignee, 'isAdmin', isAdmin, 'isCreator', isCreator)
        
        // Determine allowed fields
        if (isSelfTask || isAdmin || isObserver || isCreator) {
            allowedFields = [
                "title",
                "description",
                "assignees",
                "observers",
                "dueDateTime",
                "priority",
                "status",
                "documents",
                "deleteDocuments"
            ];
        } else if (isAssignee) {
            // Pure assignee can only update status and add documents
            allowedFields = ['status', 'documents'];
        } else {
            return res.status(403).json({ message: "You are not allowed to update this task" });
        }
        console.log('allowed fields= ', allowedFields, ' changes= ', req.body)
        // Validate and process each field
        for (const field in req.body) {
            if (!allowedFields.includes(field)) {
                continue; // Skip unauthorized fields
            }
            const value = req.body[field];

            switch (field) {
                case "title":
                    if (typeof value !== "string" || value.trim().length === 0) {
                        return res.status(400).json({ message: "Title must be a non-empty string" });
                    } else if (value.trim().length > 300) {
                        return res.status(400).json({ message: "Title must not exceed 300 characters" });
                    } else {
                        filteredUpdate.title = value.trim();
                    }
                    break;

                case "description":
                    if (value !== null && value !== undefined) {
                        if (typeof value !== "string") {
                            return res.status(400).json({ message: "Description must be a string" });
                        } else if (value.length > 2000) {
                            return res.status(400).json({ message: "Description must not exceed 2000 characters" });
                        } else {
                            filteredUpdate.description = value.trim();
                        }
                    }
                    break;

                case "assignees":
                    const assigneesArray = Array.isArray(value) ? value : [value].filter(Boolean);
                    if (assigneesArray.length === 0) {
                        return res.status(400).json({ message: "Task must have atleast 1 dooer" });
                    }
                    filteredUpdate.assignees = [...new Set(assigneesArray)];
                    break;

                case "observers":
                    const observersArray = Array.isArray(value) ? value : [value].filter(Boolean);
                    if (observersArray.length === 0) {
                        return res.status(400).json({ message: "Task must have atleast 1 viewer" });
                    }
                    filteredUpdate.observers = [...new Set(observersArray)];
                    break;

                case "dueDateTime":
                    const date = new Date(value);
                    if (!value || isNaN(date.getTime())) {
                        return res.status(400).json({ message: "Invalid or missing due date" });
                    } else {
                        filteredUpdate.dueDateTime = date;
                    }
                    break;

                case "priority":
                    const validPriorities = ['High', 'Medium', 'Low'];
                    if (!validPriorities.includes(value)) {
                        return res.status(400).json({ message: `Priority must be one of: ${validPriorities.join(", ")}` });
                    } else {
                        filteredUpdate.priority = value;
                    }
                    break;

                case "status":
                    const validStatuses = ['Completed', 'In Progress', 'Pending', 'For Approval'];
                    if (!validStatuses.includes(value)) {
                        return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
                    } else {
                        // Store status temporarily, will process after determining task type
                        filteredUpdate._pendingStatus = value;
                    }
                    break;

                case "deleteDocuments":
                    // Only admin, observer or creator can delete documents
                    if (!isAdmin && !isObserver && !isCreator) {
                        return res.status(403).json({
                            message: "You don't have permission to delete documents"
                        });
                    }
                    const docIdsToDelete = Array.isArray(value) ? value : [value].filter(Boolean);
                    filteredUpdate._deleteDocuments = docIdsToDelete;
                    break;
            }
        }

        // ================= DOCUMENT DELETION =================
        if (filteredUpdate._deleteDocuments && filteredUpdate._deleteDocuments.length > 0) {
            const deletedDocs = [];
            const remainingDocs = [];

            for (const doc of task.documents) {
                if (filteredUpdate._deleteDocuments.includes(doc._id.toString())) {
                    // This document is in the delete list
                    const filePath = path.join("uploads", path.basename(doc.path));

                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted file: ${filePath}`);
                        } catch (err) {
                            console.error(`Failed to delete file: ${filePath}`, err);
                        }
                    }

                    deletedDocs.push(doc._id.toString());
                } else {
                    // Keep this document
                    remainingDocs.push(doc);
                }
            }

            if (deletedDocs.length > 0) {
                filteredUpdate.documents = remainingDocs;
                console.log(`Deleted ${deletedDocs.length} documents from database`);
            }

            delete filteredUpdate._deleteDocuments;
        }

        // ================= DOCUMENT UPLOAD =================
        if (req.files && req.files.length > 0) {
            const existingDocuments = filteredUpdate.documents || task.documents || [];

            // Create a Set of existing file names (lowercase for case-insensitive comparison)
            const existingFileNames = new Set(
                existingDocuments.map(doc => doc.originalName.toLowerCase())
            );

            const uploadedDocs = [];
            const duplicateFiles = [];

            for (const file of req.files) {
                const fileNameLower = file.originalname.toLowerCase();

                // Check for duplicates
                if (existingFileNames.has(fileNameLower)) {
                    duplicateFiles.push(file.originalname);
                    // Delete the uploaded file since it's a duplicate
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } else {
                    uploadedDocs.push({
                        filename: file.filename,
                        originalName: file.originalname,
                        path: file.path,
                        size: file.size,
                        mimeType: file.mimetype,
                        fileExtension: path.extname(file.originalname),
                        uploadedBy: userId,
                        uploadedAt: new Date()
                    });
                    existingFileNames.add(fileNameLower);
                }
            }

            if (uploadedDocs.length > 0) {
                filteredUpdate.documents = [
                    ...existingDocuments,
                    ...uploadedDocs
                ];
            }

            // Store duplicate warning
            if (duplicateFiles.length > 0) {
                filteredUpdate._duplicateWarning = `Skipped duplicate files: ${duplicateFiles.join(', ')}`;
            }
        }
        // -------------------------------------------------------------------------------------------------------------------------------------
        // Determine final assignees and observers after update
        const finalAssignees = filteredUpdate.assignees || task.assignees;
        const finalObservers = filteredUpdate.observers || task.observers;

        const newAssignees = finalAssignees
            .map(id => id.toString())
            .filter(id => !oldAssignees.includes(id));

        const newObservers = finalObservers
            .map(id => id.toString())
            .filter(id => !oldObservers.includes(id));


        // Check if task should be converted to self task or regular task
        // We check against the task creator, not the current editor
        let willBeSelfTask = false;
        if (
            finalAssignees.length === 1 &&
            finalObservers.length === 1 &&
            finalAssignees[0].toString() === finalObservers[0].toString() &&
            finalAssignees[0].toString() === task.createdBy.toString()
        ) {
            filteredUpdate.isSelfTask = true;
            willBeSelfTask = true;
        } else {
            filteredUpdate.isSelfTask = false;
            willBeSelfTask = false;
        }

        // ========= RESET STATUS IF OVERDUE & NEW DUE DATE FIXES IT =========
        if (filteredUpdate.dueDateTime) {
            const now = new Date();

            // if previously overdue AND new due date is still in future
            if (
                task.status === "Overdue" &&
                filteredUpdate.dueDateTime > now
            ) {
                filteredUpdate.status = "Pending";
            }
        }


        // ================= STATUS UPDATE LOGIC =================
        // Process status change based on task type and user role
        if (filteredUpdate._pendingStatus) {
            const newStatus = filteredUpdate._pendingStatus;

            // Determine if user will be observer in the updated task
            const willBeObserver = finalObservers.map(String).includes(userId.toString());

            if (newStatus === 'Completed') {
                // If marking as completed
                if (willBeSelfTask || isAdmin || willBeObserver) {
                    // Self task - user is both assignee and observer, can directly complete
                    // Admin or Observer can directly mark as completed
                    filteredUpdate.status = 'Completed';
                } else if (isAssignee && !willBeObserver) {
                    // Pure assignee (not observer, not admin) - mark for approval
                    filteredUpdate.status = 'For Approval';
                } else {
                    // Default to the requested status
                    filteredUpdate.status = newStatus;
                }
            } else {
                // For any other status (Pending, In Progress, For Approval), set directly
                filteredUpdate.status = newStatus;
            }

            // Remove temporary field
            delete filteredUpdate._pendingStatus;
        }

        // Extract warning before update
        const duplicateWarning = filteredUpdate._duplicateWarning;
        delete filteredUpdate._duplicateWarning;

        // Check if there are any fields to update (excluding isSelfTask which might be redundant)
        const updateKeys = Object.keys(filteredUpdate).filter(k => !k.startsWith('_'));
        if (updateKeys.length === 0) {
            return res.status(400).json({
                message: "No valid fields to update"
            });
        }

        // Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $set: filteredUpdate },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({
                message: "Failed to update task. Please try again."
            });
        }
        let taskObj = updatedTask.toObject();
        
        // Response masking: if the user is an assignee but not an observer/admin,
        // they should see "Completed" instead of "For Approval"
        if (
            taskObj.status === "For Approval" &&
            !isAdmin &&
            !updatedTask.observers.map(String).includes(userId.toString()) &&
            updatedTask.assignees.map(String).includes(userId.toString())
        ) {
            taskObj.status = "Completed";
        }

        // Combine unique newly added users
        const newlyAddedUsers = [...new Set([...newAssignees, ...newObservers])];

        if (newlyAddedUsers.length > 0) {
            const users = await User.find(
                {
                    _id: { $in: newlyAddedUsers },
                },
                { expoPushToken: 1 }
            );

            for (const user of users) {
                const uid = user._id.toString();
                const isAssignee = newAssignees.includes(uid);
                const isObserver = newObservers.includes(uid);

                let title = "";
                let message = "";

                if (isAssignee && isObserver) {
                    title = "Added to Task";
                    message = `You have been added to task: ${updatedTask.title}`;
                } else if (isAssignee) {
                    title = "New Task Assigned";
                    message = `You have been assigned to task: ${updatedTask.title}`;
                } else if (isObserver) {
                    title = "Task Viewer Update";
                    message = `You are added as a viewer to task: ${updatedTask.title}`;
                }

                await sendPushNotification(
                    user.expoPushToken,
                    title,
                    message,
                    "foranotif.wav"
                );
                await Notification.create({
                    userId: uid,
                    senderId: userId,
                    taskId,
                    message,
                    dueDateTime: updatedTask.dueDateTime,
                    company: req.user.company
                });

            }
        }
        const response = {
            success: true,
            message: "Task updated successfully",
            data: taskObj
        };

        // Add duplicate warning if any
        if (duplicateWarning) {
            response.warning = duplicateWarning;
        }

        return res.status(200).json(response);

    } catch (err) {
        console.error("Edit task error:", err);
        return res.status(500).json({ error: err.message });
    }
}

const searchTasks = async (req, res) => {
    try {
        const q = req.query.q;

        if (!q) return res.status(400).json({ message: "Search query required" });

        const userId = new mongoose.Types.ObjectId(req.user.id);
        const role = req.user.role;
        const companyId = new mongoose.Types.ObjectId(req.user.company);

        const match = {
            company: companyId,
            title: { $regex: q, $options: "i" } // case-insensitive partial match
        };

        // permissions
        if (role !== "admin") {
            match.$or = [
                { assignees: userId },
                { observers: userId }
            ];
        }

        const tasks = await Task.find(match)
            .select("title description")
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            success: true,
            results: tasks
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Get recurring task completion history
const getTaskCompletionHistory = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const role = req.user.role;
        const companyId = req.user.company;
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const skip = page * limit;

        // Verify task exists and user has access
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check access
        if (role !== 'admin') {
            const hasAccess = task.assignees.map(String).includes(userId) ||
                             task.observers.map(String).includes(userId) ||
                             task.createdBy.toString() === userId;
            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Get completion history
        const TaskCompletionHistory = require('../models/taskCompletionHistory');
        
        const history = await TaskCompletionHistory.find({ task: taskId })
            .populate('completedBy', 'firstName lastName email avatar')
            .populate('approvedBy', 'firstName lastName email')
            .sort({ completedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await TaskCompletionHistory.countDocuments({ task: taskId });

        // Calculate statistics
        const stats = await TaskCompletionHistory.aggregate([
            { $match: { task: new mongoose.Types.ObjectId(taskId) } },
            {
                $group: {
                    _id: null,
                    totalCompletions: { $sum: 1 },
                    onTimeCompletions: {
                        $sum: { $cond: ['$completedOnTime', 1, 0] }
                    },
                    avgDaysOverdue: { $avg: '$daysOverdue' }
                }
            }
        ]);

        const completionStats = stats[0] || {
            totalCompletions: 0,
            onTimeCompletions: 0,
            avgDaysOverdue: 0
        };

        res.status(200).json({
            success: true,
            task: {
                id: task._id,
                title: task.title,
                taskType: task.taskType,
                recurringSchedule: task.recurringSchedule
            },
            history: history.map(h => ({
                id: h._id,
                completedBy: h.completedBy,
                completedAt: h.completedAt,
                statusAtCompletion: h.statusAtCompletion,
                originalDueDate: h.originalDueDate,
                completedOnTime: h.completedOnTime,
                daysOverdue: h.daysOverdue,
                cycleNumber: h.cycleNumber,
                approvedBy: h.approvedBy,
                approvedAt: h.approvedAt,
                wasAutoApproved: h.wasAutoApproved,
                completionNotes: h.completionNotes
            })),
            stats: {
                totalCompletions: completionStats.totalCompletions,
                onTimeCompletions: completionStats.onTimeCompletions,
                onTimePercentage: completionStats.totalCompletions > 0 
                    ? ((completionStats.onTimeCompletions / completionStats.totalCompletions) * 100).toFixed(1)
                    : 0,
                avgDaysOverdue: completionStats.avgDaysOverdue?.toFixed(1) || 0
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createTask, getTask, createSubTask, deleteTask, getTaskList, deleteDocument, editTask, searchTasks, markAsCompleted, getTaskCompletionHistory };