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
        required:true
    },
});

module.exports = mongoose.model('Company', companySchema);