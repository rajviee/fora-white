const Task = require('../models/task');
const mongoose = require('mongoose');
// 3 status, pie chart
// task progress(completed/total), total tasks, overdue
// high,medium,low,overdue

const tasksSummarySafe = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const role = req.user.role;
        // const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;
        const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;
        if (isSelfTask === null) return res.status(400).json({ message: "Invalid value for isSelfTask. Must be 'true' or 'false'." });
        let totalTasks = 0, completedTasks = 0, overdueTasks = 0, highPriority = 0, mediumPriority = 0, lowPriority = 0, overduePriority = 0;

        // role admin and self tasks
        if (isSelfTask) {
            let result = await Task.aggregate([
                { $match: { isSelfTask: isSelfTask, createdBy: userId, company: req.user.company } },
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },
                        completedTasks: { $sum: { $cond: [{ $or: [{ $eq: ['$status', 'Completed'] }, { $eq: ['$status', 'For Approval'] }] }, 1, 0] } },
                        overdueTasks: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
                        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
                        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'Medium'] }, 1, 0] } },
                        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'Low'] }, 1, 0] } },
                        overduePriority: { $sum: { $cond: [{ $eq: ['$priority', 'Overdue'] }, 1, 0] } }
                    }
                }]);
            if (result && result[0]) ({ totalTasks, completedTasks, overdueTasks, highPriority, mediumPriority, lowPriority, overduePriority } = result[0]);
        }

        res.status(200).json({ totalTasks, completedTasks, overdueTasks, highPriority, mediumPriority, lowPriority, overduePriority });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const tasksSummary = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const role = req.user.role;
        const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;
        if (isSelfTask === null) return res.status(400).json({ message: "Invalid value for isSelfTask. Must be 'true' or 'false'." });
        const companyId = new mongoose.Types.ObjectId(req.user.company);

        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        let allTimeTotalTasks = 0,
            allTimeCompletedTasks = 0,
            allTimeOverdueTasks = 0,
            todayhighPriority = 0,
            todaymediumPriority = 0,
            todaylowPriority = 0,
            todayoverduePriority = 0;

        let dataForAllTime, dataForToday;
        const matchConditions = {
            isSelfTask: isSelfTask,
            company: companyId
        }
        const matchConditionsToday = {
            isSelfTask: isSelfTask,
            dueDateTime: { $gte: start, $lt: end },
            company: companyId
        }
        const completeCondition = !isSelfTask && role !== "admin" ? {
            $and: [
                { $not: { $in: [userId, "$observers"] } },
                { $eq: ["$status", "For Approval"] }
            ]
        } : null;
        if (isSelfTask) {
            matchConditions.createdBy = userId;
            matchConditionsToday.createdBy = userId;
        } else if (!isSelfTask && role !== "admin") {
            const orCondition = [
                { observers: userId },
                { assignees: userId },
                { createdBy: userId }
            ];
            matchConditions.$or = orCondition;
            matchConditionsToday.$or = orCondition;
        }

        //data for today = tasks => high med low n overdue priority
        dataForToday = await Task.aggregate([
            {
                $match: matchConditionsToday
            },
            {
                $group: {
                    _id: null,
                    todayoverduePriority: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
                    todayhighPriority: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $eq: ['$priority', 'High'] },
                                    { $ne: ['$status', 'Overdue'] }
                                ]
                            }, 1, 0]
                        }
                    },
                    todaymediumPriority: { $sum: { $cond: [{ $and: [{ $eq: ['$priority', 'Medium'] }, { $ne: ['$status', 'Overdue'] }] }, 1, 0] } },
                    todaylowPriority: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $eq: ['$priority', 'Low'] },
                                    { $ne: ['$status', 'Overdue'] }
                                ]
                            }, 1, 0]
                        }
                    }
                }
            }
        ]);
        if (dataForToday && dataForToday[0])
            ({ todayoverduePriority, todayhighPriority, todaymediumPriority, todaylowPriority } = dataForToday[0]);

        // data for all time => total tasks, task progress, overdue
        dataForAllTime = await Task.aggregate([
            {
                $match: matchConditions
            },
            {
                $group: {
                    _id: null,
                    allTimeTotalTasks: { $sum: 1 },
                    allTimeCompletedTasks: {
                        $sum: {
                            $cond: [{
                                $or: [
                                    { $eq: ["$status", "Completed"] },
                                    completeCondition
                                ]
                            }, 1, 0]
                        }
                    },
                    allTimeOverdueTasks: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
                }
            }
        ]);
        if (dataForAllTime && dataForAllTime[0])
            ({ allTimeOverdueTasks, allTimeTotalTasks, allTimeCompletedTasks } = dataForAllTime[0]);
        res.status(200).json({ todayoverduePriority, todayhighPriority, todaymediumPriority, todaylowPriority, allTimeOverdueTasks, allTimeTotalTasks, allTimeCompletedTasks })
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}
//taskname, priority, deadline,status
const todaysTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const companyId = new mongoose.Types.ObjectId(req.user.company);

        const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;

        if (isSelfTask === null) return res.status(400).json({ message: "Invalid value for isSelfTask. Must be 'true' or 'false'." });

        const page = parseInt(req.query.page, 10) || 0;
        const perPage = parseInt(req.query.perPage, 10) || 5;

        if ((page && page < 0) || (perPage && perPage < 0)) {
            return res.status(500).json({ error: "Invalid parameters passed" });
        }

        const skip = (page) * perPage;
        const limit = perPage;

        console.log(userId, role, isSelfTask, page, perPage);

        const start = new Date();
        start.setUTCHours(0, 0, 0, 0); // today 00:00:00
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999); // today 23:59:59.999

        let taskDetails;
        let totalTasks;
        if (isSelfTask) {
            taskDetails = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        company: companyId,
                        createdBy: new mongoose.Types.ObjectId(userId),
                        dueDateTime: { $gte: start, $lt: end }
                    }
                },
                {
                    $addFields: {
                        priorityOrder: { $indexOfArray: [["High", "Medium", "Low"], "$priority"] },
                        statusOrder: { $indexOfArray: [["Overdue", "For Approval", "In Progress", "Pending", "Completed"], "$status"] }
                    }
                },
                {
                    $sort: {
                        priorityOrder: 1,  // then by priority (custom order)
                        statusOrder: 1,   // then by status (custom order)
                        dueDateTime: 1,   // first by date
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        priority: 1,
                        observers: 1,
                        dueDateTime: 1,
                        status: 1
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);
            console.log("taskDetails", taskDetails);


            totalTasks = await Task.countDocuments({
                isSelfTask: isSelfTask,
                company: companyId,
                createdBy: new mongoose.Types.ObjectId(userId),
                dueDateTime: {
                    $gte: start,
                    $lt: end
                }
            });
        } else if (role === 'admin') {
            taskDetails = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        company: companyId,
                        dueDateTime: { $gte: start, $lt: end }
                    }
                },
                {
                    $addFields: {
                        priorityOrder: { $indexOfArray: [["High", "Medium", "Low"], "$priority"] },
                        statusOrder: { $indexOfArray: [["Overdue", "For Approval", "In Progress", "Pending", "Completed"], "$status"] }
                    }
                },
                {
                    $sort: {
                        priorityOrder: 1,  // then by priority (custom order)
                        statusOrder: 1,   // then by status (custom order)
                        dueDateTime: 1,   // first by date
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        priority: 1,
                        observers: 1,
                        dueDateTime: 1,
                        status: 1
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);

            totalTasks = await Task.countDocuments({
                isSelfTask: isSelfTask, company: companyId, dueDateTime: {
                    $gte: start,
                    $lt: end
                }
            });
        } else {

            taskDetails = await Task.aggregate([
                {
                    $match: {
                        isSelfTask: isSelfTask,
                        company: companyId,
                        dueDateTime: { $gte: start, $lt: end },
                        $or: [
                            { assignees: new mongoose.Types.ObjectId(userId) },
                            { observers: new mongoose.Types.ObjectId(userId) },
                            { createdBy: new mongoose.Types.ObjectId(userId) }
                        ]
                    }
                },
                {
                    $addFields: {
                        priorityOrder: { $indexOfArray: [["High", "Medium", "Low"], "$priority"] },
                        statusOrder: { $indexOfArray: [["Overdue", "For Approval", "In Progress", "Pending", "Completed"], "$status"] }
                    }
                },
                {
                    $sort: {
                        priorityOrder: 1,  // then by priority (custom order)
                        statusOrder: 1,   // then by status (custom order)
                        dueDateTime: 1,   // first by date
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        priority: 1,
                        observers: 1,
                        dueDateTime: 1,
                        status: 1
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);

            totalTasks = await Task.countDocuments({
                isSelfTask: isSelfTask, company: companyId, dueDateTime: {
                    $gte: start,
                    $lt: end
                }, $or: [
                    { assignees: new mongoose.Types.ObjectId(userId) },
                    { observers: new mongoose.Types.ObjectId(userId) },
                    { createdBy: new mongoose.Types.ObjectId(userId) }
                ]
            });
        }

        const modifiedTasks = taskDetails.map(task => {
            let taskObject = task;

            if (role !== "admin" && !taskObject.observers.map(String).includes(userId) && taskObject.status === "For Approval") {
                taskObject.status = "Completed";
            }
            return taskObject;
        });

        const totalPages = Math.ceil(totalTasks / perPage);
        const response = {
            tasks: modifiedTasks,
            totalTasks,
            totalPages,
            currentPage: page,
            perPage,
        };

        return res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const statisticsGraph = async (req, res) => {

    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const isSelfTask = req.query.isSelfTask === 'true' ? true : req.query.isSelfTask === 'false' ? false : null;
        if (isSelfTask === null) return res.status(400).json({ message: "Invalid value for isSelfTask. Must be 'true' or 'false'." });
        const companyId = new mongoose.Types.ObjectId(req.user.company);
        const userId = new mongoose.Types.ObjectId(req.user.id);
        let stats, response, monthData;

        if (isSelfTask) {
            stats = await Task.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        isSelfTask: isSelfTask,
                        company: companyId,
                        createdBy: userId
                    },
                },
                {
                    $project: {
                        month: { $month: "$dueDateTime" },
                        statusGroup: {
                            $cond: [{ $eq: ["$status", "Completed"] }, "completed", "incomplete"]
                        }
                    }
                },
                {
                    $group: {
                        _id: { month: "$month", statusGroup: "$statusGroup" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.month",
                        stats: {
                            $push: {
                                status: "$_id.statusGroup",
                                count: "$count"
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            // Fill months with 0 where no data
            response = Array.from({ length: 12 }, (_, i) => {
                monthData = stats.find((s) => s._id === i + 1);
                return {
                    month: i + 1,
                    completed:
                        monthData?.stats.find((st) => st.status === "completed")?.count || 0,
                    incomplete:
                        monthData?.stats.find((st) => st.status === "incomplete")?.count || 0,
                };
            });
        }
        if (!isSelfTask && req.user.role == 'admin') {
            const stats = await Task.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        isSelfTask: isSelfTask,
                        company: companyId,
                    },
                },
                {
                    $project: {
                        month: { $month: "$dueDateTime" },
                        statusGroup: {
                            $cond: [{ $eq: ["$status", "Completed"] }, "completed", "incomplete"]
                        }
                    }
                },
                {
                    $group: {
                        _id: { month: "$month", statusGroup: "$statusGroup" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.month",
                        stats: {
                            $push: {
                                status: "$_id.statusGroup",
                                count: "$count"
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            response = Array.from({ length: 12 }, (_, i) => {
                monthData = stats.find((s) => s._id === i + 1);
                return {
                    month: i + 1,
                    completed:
                        monthData?.stats.find((st) => st.status === "completed")?.count || 0,
                    incomplete:
                        monthData?.stats.find((st) => st.status === "incomplete")?.count || 0,
                };
            });
        }

        if (req.user.role !== 'admin' && !isSelfTask) {
            const stats = await Task.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfYear },
                        isSelfTask: isSelfTask,
                        company: companyId,
                        $or: [
                            { assignees: userId },
                            { observers: userId },
                            { createdBy: userId }
                        ]
                    },
                },
                {
                    $project: {
                        month: { $month: "$dueDateTime" },
                        statusGroup: {
                            $cond: [
                                { $in: ["$status", ["Completed", "For Approval"]] },
                                "completed",
                                "incomplete"
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: { month: "$month", statusGroup: "$statusGroup" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.month",
                        stats: {
                            $push: {
                                status: "$_id.statusGroup",
                                count: "$count"
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            response = Array.from({ length: 12 }, (_, i) => {
                monthData = stats.find((s) => s._id === i + 1);
                return {
                    month: i + 1,
                    completed:
                        monthData?.stats.find((st) => st.status === "completed")?.count || 0,
                    incomplete:
                        monthData?.stats.find((st) => st.status === "incomplete")?.count || 0,
                };
            });
        }
        res.json(response);
    } catch (err) {
        console.error("Error generating stats:", err);
        res.status(500).json({ message: "Error generating stats" });
    }
};

module.exports = { todaysTasks, tasksSummary, statisticsGraph };
