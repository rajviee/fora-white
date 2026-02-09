const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: null
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    invoiceUrl: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    userCountAtPayment: {
        type: Number,
        required: true
    },
    billingPeriodStart: {
        type: Date,
        required: true
    },
    billingPeriodEnd: {
        type: Date,
        required: true
    },
    paymentDate: {
        type: Date,
        default: null
    },
    // Additional metadata
    failureReason: {
        type: String,
        default: null
    },
    refundId: {
        type: String,
        default: null
    },
    refundAmount: {
        type: Number,
        default: null
    },
    refundDate: {
        type: Date,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Generate unique invoice number
paymentSchema.statics.generateInvoiceNumber = async function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await this.countDocuments({
        createdAt: {
            $gte: new Date(year, date.getMonth(), 1),
            $lt: new Date(year, date.getMonth() + 1, 1)
        }
    });
    
    return `FT-${year}${month}-${String(count + 1).padStart(5, '0')}`;
};

// Index for faster queries
paymentSchema.index({ company: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
