const mongoose = require("mongoose");
const subTask = require("./subtask");
// In your queries, you can use .populate("assignees") to fetch full user details instead of just IDs.
//68bc38cc77274fc1cbf12b8a
// Required: task name, assignee, observer, createdby, priority(having default), tasktype(having default), reminder (having default), repeat reminder(can be null)
//subtasks and upload doc remaining

const taskSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task Title is Required'],
        maxLength:300
    },
    description: {
        type: String,
        maxLength: 2000,
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
            required: true,
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
    taskType: {
        type: String,
        required: true,
        enum: ['Single', 'Recurring'],
        default: 'Single'
    },
    isSelfTask: {
        type: Boolean,
        required: true,
        default: false
    },
    // NEW: Remote task flag
    isRemote: {
        type: Boolean,
        default: false
    },
    // NEW: Multi-location support
    isMultiLocation: {
        type: Boolean,
        default: false
    },
    locations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskLocation'
    }],
    // Current active location for tracking
    currentLocationIndex: {
        type: Number,
        default: 0
    },
    recurringSchedule: {
        type: String,
        enum: ["Daily", "Weekly", "Monthly", "3-Months"],
        default: null,
    },
    reminder: {
        type: Date, // exact reminder timestamp before dueDateTime
    },
    subTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subtask',
        default: null
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
    notification: [{
        date: { type: Date},
        notifId: { type: mongoose.Schema.Types.ObjectId, ref: "Notification", default: null },
        type: { type: String }
    }],
    company:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Company', 
      required:true 
    },
    documents: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimeType: {
            type: String,
            required: false,
        },
        fileExtension: {
            type: String,
            required: true,
            enum: ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.txt']
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    }],
},
    { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);