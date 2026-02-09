const mongoose = require('mongoose');

const masterAdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.[a-zA-Z]{2,})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    role: {
        type: String,
        default: 'master-admin',
        immutable: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    avatar: {
        filename: { type: String, default: null },
        originalName: { type: String, default: null },
        path: { type: String, default: null },
        size: { type: Number, default: null },
        mimeType: { type: String, default: null },
        fileExtension: {
            type: String,
            enum: ['.png', '.jpg', '.jpeg', null],
            default: null
        },
        uploadedAt: { type: Date, default: Date.now }
    },
    permissions: {
        canManageCompanies: { type: Boolean, default: true },
        canManageSubscriptions: { type: Boolean, default: true },
        canViewAnalytics: { type: Boolean, default: true },
        canManagePayments: { type: Boolean, default: true },
        canExportData: { type: Boolean, default: true },
        canRestrictCompanies: { type: Boolean, default: true }
    },
    activityLog: [{
        action: String,
        targetType: String,
        targetId: mongoose.Schema.Types.ObjectId,
        details: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        ipAddress: String
    }]
}, {
    timestamps: true
});

// Log activity helper
masterAdminSchema.methods.logActivity = async function(action, targetType, targetId, details, ipAddress) {
    this.activityLog.push({
        action,
        targetType,
        targetId,
        details,
        timestamp: new Date(),
        ipAddress
    });
    
    // Keep only last 100 activities
    if (this.activityLog.length > 100) {
        this.activityLog = this.activityLog.slice(-100);
    }
    
    await this.save();
};

module.exports = mongoose.model('MasterAdmin', masterAdminSchema);
