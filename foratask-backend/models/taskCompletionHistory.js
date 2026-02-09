const mongoose = require('mongoose');

const taskCompletionHistorySchema = new mongoose.Schema({
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    // Snapshot of task at completion time
    taskSnapshot: {
        title: { type: String, required: true },
        description: { type: String },
        priority: { type: String, enum: ['High', 'Medium', 'Low'] },
        taskType: { type: String, enum: ['Single', 'Recurring'] },
        recurringSchedule: { type: String, enum: ['Daily', 'Weekly', 'Monthly', '3-Months'] },
        isSelfTask: { type: Boolean }
    },
    // Completion details
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    statusAtCompletion: {
        type: String,
        enum: ['Completed', 'For Approval'],
        required: true
    },
    // Approval details (if applicable)
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    wasAutoApproved: {
        type: Boolean,
        default: false
    },
    // Due date information
    originalDueDate: {
        type: Date,
        required: true
    },
    // Was it completed on time?
    completedOnTime: {
        type: Boolean,
        required: true
    },
    // Time-related metrics
    daysOverdue: {
        type: Number,
        default: 0
    },
    hoursToComplete: {
        type: Number,
        default: null
    },
    // Assignees at completion time
    assigneesSnapshot: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    observersSnapshot: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Recurring task cycle information
    cycleNumber: {
        type: Number,
        default: 1
    },
    cycleStartDate: {
        type: Date,
        default: null
    },
    cycleEndDate: {
        type: Date,
        default: null
    },
    // Notes or comments at completion
    completionNotes: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
taskCompletionHistorySchema.index({ task: 1, completedAt: -1 });
taskCompletionHistorySchema.index({ company: 1, completedAt: -1 });
taskCompletionHistorySchema.index({ completedBy: 1, completedAt: -1 });
taskCompletionHistorySchema.index({ 'taskSnapshot.taskType': 1 });

// Static method to create history entry
taskCompletionHistorySchema.statics.createFromTask = async function(task, completedBy, statusAtCompletion, cycleNumber = 1) {
    const now = new Date();
    const dueDate = new Date(task.dueDateTime);
    const completedOnTime = now <= dueDate;
    const daysOverdue = completedOnTime ? 0 : Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
    
    return await this.create({
        task: task._id,
        company: task.company,
        taskSnapshot: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            taskType: task.taskType,
            recurringSchedule: task.recurringSchedule,
            isSelfTask: task.isSelfTask
        },
        completedBy,
        completedAt: now,
        statusAtCompletion,
        originalDueDate: task.dueDateTime,
        completedOnTime,
        daysOverdue,
        assigneesSnapshot: task.assignees,
        observersSnapshot: task.observers,
        cycleNumber,
        wasAutoApproved: task.isSelfTask || (statusAtCompletion === 'Completed')
    });
};

module.exports = mongoose.model('TaskCompletionHistory', taskCompletionHistorySchema);
