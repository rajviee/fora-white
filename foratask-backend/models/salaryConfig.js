const mongoose = require('mongoose');

// Salary breakdown component (just a part of the whole)
const salaryComponentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    percentage: { type: Number, required: true, default: 0 }
}, { _id: true });

const salaryConfigSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    // The fixed total amount (e.g., 10,000)
    totalSalary: {
        type: Number,
        default: 0
    },
    // The breakdown parts (e.g., Basic 50%, HRA 20%, etc.)
    breakdown: [salaryComponentSchema],
    
    effectiveFrom: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Calculate the actual value of each part for a record
salaryConfigSchema.methods.getFormattedBreakdown = function() {
    return this.breakdown.map(item => ({
        name: item.name,
        percentage: item.percentage,
        value: (this.totalSalary * item.percentage) / 100
    }));
};

module.exports = mongoose.model('SalaryConfig', salaryConfigSchema);
