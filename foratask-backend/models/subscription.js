const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['trial', 'active', 'expired', 'cancelled'],
        default: 'trial'
    },
    planType: {
        type: String,
        enum: ['free_trial', 'paid'],
        default: 'free_trial'
    },
    currentUserCount: {
        type: Number,
        default: 1
    },
    basePrice: {
        type: Number,
        default: 249
    },
    perUserPrice: {
        type: Number,
        default: 50
    },
    basePlanUserLimit: {
        type: Number,
        default: 5
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    // Trial details
    trialStartDate: {
        type: Date,
        default: null
    },
    trialEndDate: {
        type: Date,
        default: null
    },
    // Paid subscription details
    subscriptionStartDate: {
        type: Date,
        default: null
    },
    currentPeriodStart: {
        type: Date,
        default: null
    },
    currentPeriodEnd: {
        type: Date,
        default: null
    },
    nextBillingDate: {
        type: Date,
        default: null
    },
    billingAnchorDay: {
        type: Number,
        default: null,
        min: 1,
        max: 31
    },
    // Razorpay integration
    razorpaySubscriptionId: {
        type: String,
        default: null
    },
    razorpayCustomerId: {
        type: String,
        default: null
    },
    razorpayPlanId: {
        type: String,
        default: null
    },
    // Billing history
    lastPaymentDate: {
        type: Date,
        default: null
    },
    lastPaymentAmount: {
        type: Number,
        default: null
    },
    lastPaymentStatus: {
        type: String,
        enum: ['success', 'failed', 'pending', null],
        default: null
    },
    // Notification tracking
    expiryNotificationsSent: {
        sevenDay: { type: Boolean, default: false },
        threeDay: { type: Boolean, default: false },
        oneDay: { type: Boolean, default: false },
        expired: { type: Boolean, default: false }
    },
    // Admin restriction (manual by master admin)
    isManuallyRestricted: {
        type: Boolean,
        default: false
    },
    restrictionReason: {
        type: String,
        default: null
    },
    restrictedAt: {
        type: Date,
        default: null
    },
    restrictedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterAdmin',
        default: null
    }
}, {
    timestamps: true
});

// Calculate subscription amount based on user count
subscriptionSchema.methods.calculateAmount = function() {
    const userCount = this.currentUserCount;
    const baseLimit = this.basePlanUserLimit;
    const basePrice = this.basePrice;
    const perUserPrice = this.perUserPrice;
    
    if (userCount <= baseLimit) {
        return basePrice;
    }
    return basePrice + ((userCount - baseLimit) * perUserPrice);
};

// Check if subscription is accessible
subscriptionSchema.methods.isAccessible = function() {
    if (this.isManuallyRestricted) return false;
    if (this.status === 'cancelled') return false;
    if (this.status === 'expired') return false;
    return true;
};

// Get days until expiry
subscriptionSchema.methods.getDaysUntilExpiry = function() {
    const now = new Date();
    let endDate;
    
    if (this.status === 'trial') {
        endDate = this.trialEndDate;
    } else if (this.status === 'active') {
        endDate = this.currentPeriodEnd;
    } else {
        return 0;
    }
    
    if (!endDate) return 0;
    
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
};

// Calculate next billing date with anchor day logic
subscriptionSchema.methods.calculateNextBillingDate = function(fromDate = new Date()) {
    const anchorDay = this.billingAnchorDay;
    if (!anchorDay) return null;
    
    const nextMonth = new Date(fromDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Handle months with fewer days
    const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const billingDay = Math.min(anchorDay, lastDayOfNextMonth);
    
    nextMonth.setDate(billingDay);
    return nextMonth;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
