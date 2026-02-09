const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    companyEmail: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    companyName: {
        type: String,
        required: true
    },
    companyAddress: {
        type: String,
        default: null
    },
    companyGSTNumber: {
        type: String,
        default: null,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
    },
    companyPANNumber: {
        type: String,
        default: null,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
    },
    owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    companyContactNumber: {
        type: String,
        default: null,
        match: [/^\+[1-9]\d{1,3}[1-9]\d{6,14}$/, 'Please enter a valid contact number'],
        required: true
    },
    // Subscription reference
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null
    },
    // User limits
    maxUsers: {
        type: Number,
        default: null
    },
    currentPlanUserCount: {
        type: Number,
        default: 1
    },
    // Company status
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Pre-delete hook to cancel subscription
companySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const Subscription = mongoose.model('Subscription');
        await Subscription.findOneAndUpdate(
            { company: this._id },
            { status: 'cancelled' }
        );
        next();
    } catch (error) {
        next(error);
    }
});

// Static method to soft delete with subscription cancellation
companySchema.statics.softDelete = async function(companyId, deletedBy) {
    const Subscription = mongoose.model('Subscription');
    
    // Cancel subscription
    await Subscription.findOneAndUpdate(
        { company: companyId },
        { status: 'cancelled' }
    );
    
    // Soft delete company
    return await this.findByIdAndUpdate(companyId, {
        isActive: false,
        deletedAt: new Date(),
        deletedBy
    });
};

module.exports = mongoose.model('Company', companySchema);