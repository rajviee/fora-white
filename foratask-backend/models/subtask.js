const mongoose=require("mongoose")
const Task=require("./task.js")
const subTaskSchema = mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String
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
    parentTaskId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Task"
    },
    isSelfTask:{
        type: Boolean,
        required:true,
        default:false
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
        required: false,
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
        enum: ['Completed', 'In Progress', 'Pending', 'Overdue'],
        default: 'Pending'
    },
},
    { timestamps: true }
);
module.exports = mongoose.model('Subtask', subTaskSchema);