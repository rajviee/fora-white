const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    type: { type: String, enum: ["taskApproval","taskRejected" ,"system", "reminder","Overdue"], default: "system" },
    isRead: { type: Boolean, default: false },
    isSend: {type:Boolean,default:false},
    resolved: { type: Boolean, default: false },
    reminderTime: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => Date.now() + 2 * 24 * 60 * 60 * 1000 },
    action: {
        options: [{ type: String }], // e.g. ["approve", "reject"]
        chosen: { type: String, enum: ["approve", "reject", null], default: null }
    },
    dueDateTime:{type: Date, ref:"Task"},
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
});

module.exports = mongoose.model("Notification", notificationSchema);
