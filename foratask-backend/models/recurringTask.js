const mongoose=require('mongoose');

const recurringTask=new mongoose.Schema({
   groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
   },
   title: {
        type: String,
        required: [true, 'Task Title is Required'],
    },
description: {
        type: String,
        maxLength: 300,
    },
    assignees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    observers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
    ],
    dueDateTime: {
        type: Date,
        required: true,
    },
    priority: {
        type: String,
        required: true,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    status: {
        type: String,
        required: true,
        enum: ['Completed', 'In Progress', 'Pending', 'Overdue', 'For Approval'],
        default: 'Pending'
    },
    isSelfTask: {
        type: Boolean,
        required: true,
        default: false
    },
   recurringSchedule: {
        type: String,
        enum: ["Daily", "Weekly", "Monthly", "3-Months"],
        default: null,
    },
     reminder: {
        type: Date, // exact reminder timestamp before dueDateTime
    },
    repeatReminder: {
        type: [String],
        enum: [
            "10m",
            "30m",
            "1h",
            "1d",
            "1w"
        ],
        default: [],
    },
});

module.exports=mongoose.model('recurringTask',recurringTask);