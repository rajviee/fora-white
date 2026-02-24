const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    isRecurringYearly: { type: Boolean, default: false }
}, { _id: true });

const organizationSettingsSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    // Working Days Configuration
    workingDays: {
        monday: { type: Boolean, default: true },
        tuesday: { type: Boolean, default: true },
        wednesday: { type: Boolean, default: true },
        thursday: { type: Boolean, default: true },
        friday: { type: Boolean, default: true },
        saturday: { type: Boolean, default: false },
        sunday: { type: Boolean, default: false }
    },
    // Working Hours
    workingHours: {
        startTime: { type: String, default: '09:00' }, // 24-hour format
        endTime: { type: String, default: '18:00' },
        breakDuration: { type: Number, default: 60 }, // in minutes
        totalHours: { type: Number, default: 8 } // expected working hours per day
    },
    // Overtime Configuration
    overtime: {
        enabled: { type: Boolean, default: true },
        rateMultiplier: { type: Number, default: 1.5 }, // 1.5x normal rate
        minOvertimeMinutes: { type: Number, default: 30 } // minimum OT to count
    },
    // Holidays
    holidays: [holidaySchema],
    // Remote Work Configuration
    tasksRemoteByDefault: { type: Boolean, default: false },
    // Office Location for geofencing
    officeLocations: [{
        name: { type: String, required: true },
        address: { type: String },
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        geofenceRadius: { type: Number, default: 300 }, // meters
        isPrimary: { type: Boolean, default: false }
    }],
    // Attendance Settings
    attendance: {
        requireGeotag: { type: Boolean, default: true },
        allowRemoteAttendance: { type: Boolean, default: true },
        autoDetectLocation: { type: Boolean, default: true },
        lateToleranceMinutes: { type: Number, default: 15 },
        earlyLeaveToleranceMinutes: { type: Number, default: 15 }
    },
    // Leave Configuration
    leave: {
        paidLeavesPerMonth: { type: Number, default: 1.5 },
        carryForwardLimit: { type: Number, default: 5 },
        allowHalfDay: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Get working days count in a month
organizationSettingsSchema.methods.getWorkingDaysInMonth = function(year, month) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = days[date.getDay()];
        
        if (this.workingDays[dayName]) {
            // Check if it's a holiday
            const isHoliday = this.holidays.some(h => {
                const holidayDate = new Date(h.date);
                return holidayDate.getDate() === day && 
                       holidayDate.getMonth() === month &&
                       (holidayDate.getFullYear() === year || h.isRecurringYearly);
            });
            
            if (!isHoliday) workingDays++;
        }
    }
    
    return workingDays;
};

// Check if a location is within office geofence
organizationSettingsSchema.methods.isWithinOfficeGeofence = function(lat, lng) {
    for (const office of this.officeLocations) {
        const distance = this.calculateDistance(
            lat, lng,
            office.coordinates.latitude,
            office.coordinates.longitude
        );
        if (distance <= office.geofenceRadius) {
            return { isWithin: true, office };
        }
    }
    return { isWithin: false, office: null };
};

// Haversine formula for distance calculation
organizationSettingsSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
};

module.exports = mongoose.model('OrganizationSettings', organizationSettingsSchema);
