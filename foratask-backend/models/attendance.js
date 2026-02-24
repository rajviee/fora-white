const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    // Start of Day
    checkIn: {
        time: { type: Date, default: null },
        location: {
            type: { type: String, enum: ['office', 'task', 'remote'], default: null },
            coordinates: {
                latitude: { type: Number },
                longitude: { type: Number }
            },
            address: { type: String },
            accuracy: { type: Number }, // GPS accuracy in meters
            officeName: { type: String, default: null }, // If checked in at office
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null } // If checked in at task
        },
        isWithinGeofence: { type: Boolean, default: false },
        isLate: { type: Boolean, default: false },
        lateByMinutes: { type: Number, default: 0 }
    },
    // End of Day
    checkOut: {
        time: { type: Date, default: null },
        location: {
            type: { type: String, enum: ['office', 'task', 'remote'], default: null },
            coordinates: {
                latitude: { type: Number },
                longitude: { type: Number }
            },
            address: { type: String },
            accuracy: { type: Number },
            officeName: { type: String, default: null },
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null }
        },
        isWithinGeofence: { type: Boolean, default: false },
        isEarlyLeave: { type: Boolean, default: false },
        earlyByMinutes: { type: Number, default: 0 }
    },
    // Status
    status: {
        type: String,
        enum: ['present', 'absent', 'half-day', 'on-leave', 'holiday', 'weekend'],
        default: 'absent'
    },
    // Working hours calculation
    workingHours: {
        total: { type: Number, default: 0 }, // in minutes
        regular: { type: Number, default: 0 },
        overtime: { type: Number, default: 0 }
    },
    // Leave reference if on leave
    leaveRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaveRequest',
        default: null
    },
    // Notes
    notes: { type: String, default: null },
    // Approval (for manual corrections)
    isManualEntry: { type: Boolean, default: false },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Compound index for unique daily attendance per user
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ company: 1, date: 1 });
attendanceSchema.index({ user: 1, status: 1 });

// Calculate working hours
attendanceSchema.methods.calculateWorkingHours = function(expectedHours = 480) {
    if (!this.checkIn.time || !this.checkOut.time) {
        this.workingHours = { total: 0, regular: 0, overtime: 0 };
        return;
    }
    
    const totalMinutes = Math.floor((this.checkOut.time - this.checkIn.time) / (1000 * 60));
    const regular = Math.min(totalMinutes, expectedHours);
    const overtime = Math.max(0, totalMinutes - expectedHours);
    
    this.workingHours = {
        total: totalMinutes,
        regular,
        overtime
    };
};

// Static method to get attendance summary for a user
attendanceSchema.statics.getMonthlyStats = async function(userId, year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const records = await this.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate }
    });
    
    const stats = {
        totalDays: records.length,
        present: 0,
        absent: 0,
        halfDay: 0,
        onLeave: 0,
        holiday: 0,
        weekend: 0,
        totalWorkingMinutes: 0,
        totalOvertimeMinutes: 0,
        lateDays: 0,
        earlyLeaveDays: 0
    };
    
    records.forEach(record => {
        stats[record.status === 'half-day' ? 'halfDay' : record.status.replace('-', '')] = 
            (stats[record.status === 'half-day' ? 'halfDay' : record.status.replace('-', '')] || 0) + 1;
        stats.totalWorkingMinutes += record.workingHours.total || 0;
        stats.totalOvertimeMinutes += record.workingHours.overtime || 0;
        if (record.checkIn.isLate) stats.lateDays++;
        if (record.checkOut.isEarlyLeave) stats.earlyLeaveDays++;
    });
    
    return stats;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
