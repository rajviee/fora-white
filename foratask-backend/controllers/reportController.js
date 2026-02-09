const Task = require('../models/task');
const mongoose = require('mongoose');

// complete,in-progress, pending, overdue
const adminReportSummaryPills = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Permission denied: You cannot access employee records." });
        }
        let totalTasks=0,
             completedTasks=0,
             inProgressTasks=0,
             pendingTasks=0,
             overdueTasks=0;

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
             
        const companyId = new mongoose.Types.ObjectId(req.user.company);
        const matchConditions = { isSelfTask: false, company: companyId , ...dateCondition};

        const result = await Task.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
                    inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
                    pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    overdueTasks: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] } }
                }
            }
        ]);

        if(result && result[0]) ({
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks
        }=result[0]);

        res.status(200).json({totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const selfReportSummaryPills = async (req, res) => {
    try {
        let totalTasks=0,
             completedTasks=0,
             inProgressTasks=0,
             pendingTasks=0,
             overdueTasks=0;
        
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

        const companyId = new mongoose.Types.ObjectId(req.user.company);
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const matchConditions = { isSelfTask: true, company: companyId , createdBy: userId, ...dateCondition };

        const result = await Task.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
                    inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
                    pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    overdueTasks: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] } }
                }
            }
        ]);
        if(result && result[0]) ({
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks
        }=result[0]);

        res.status(200).json({totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports={adminReportSummaryPills, selfReportSummaryPills};
