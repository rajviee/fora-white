const SalaryConfig = require('../models/salaryConfig');
const SalaryRecord = require('../models/salaryRecord');
const Attendance = require('../models/attendance');
const LeaveRequest = require('../models/leaveRequest');
const OrganizationSettings = require('../models/organizationSettings');
const User = require('../models/user');

// Get salary config for a user
const getSalaryConfig = async (req, res) => {
    try {
        const { userId } = req.params;
        const companyId = req.user.company;

        // Check access
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const config = await SalaryConfig.findOne({ user: userId, company: companyId });

        if (!config) {
            return res.status(404).json({ message: 'Salary configuration not found' });
        }

        res.status(200).json({
            success: true,
            config: {
                ...config.toObject(),
                grossSalary: config.calculateGrossSalary(),
                totalDeductions: config.calculateDeductions(),
                netSalary: config.calculateNetSalary()
            }
        });
    } catch (error) {
        console.error('Get salary config error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create/Update salary config (Admin only)
const upsertSalaryConfig = async (req, res) => {
    try {
        const { userId } = req.params;
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const user = await User.findOne({ _id: userId, company: companyId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            basicSalary,
            components,
            standardDeductions,
            bankDetails,
            effectiveFrom
        } = req.body;

        let config = await SalaryConfig.findOne({ user: userId, company: companyId });

        if (!config) {
            config = new SalaryConfig({
                user: userId,
                company: companyId
            });
        }

        // Update fields
        if (basicSalary !== undefined) config.basicSalary = basicSalary;
        if (components !== undefined) config.components = components;
        if (standardDeductions !== undefined) {
            config.standardDeductions = {
                ...config.standardDeductions.toObject(),
                ...standardDeductions
            };
        }
        if (bankDetails !== undefined) {
            config.bankDetails = {
                ...config.bankDetails.toObject(),
                ...bankDetails
            };
        }
        if (effectiveFrom !== undefined) config.effectiveFrom = new Date(effectiveFrom);

        await config.save();

        res.status(200).json({
            success: true,
            config: {
                ...config.toObject(),
                grossSalary: config.calculateGrossSalary(),
                totalDeductions: config.calculateDeductions(),
                netSalary: config.calculateNetSalary()
            }
        });
    } catch (error) {
        console.error('Upsert salary config error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Generate monthly salary record
const generateSalaryRecord = async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.body;
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const user = await User.findOne({ _id: userId, company: companyId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const config = await SalaryConfig.findOne({ user: userId, company: companyId });
        if (!config) {
            return res.status(404).json({ message: 'Salary configuration not found' });
        }

        // Check if record already exists
        let record = await SalaryRecord.findOne({ user: userId, month, year });
        if (record && record.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Salary already paid for this month' });
        }

        // Get organization settings
        const orgSettings = await OrganizationSettings.findOne({ company: companyId });
        const workingDaysInMonth = orgSettings ? 
            orgSettings.getWorkingDaysInMonth(year, month) : 22;

        // Get attendance stats
        const attendanceStats = await Attendance.getMonthlyStats(userId, year, month);

        // Calculate salary based on attendance
        const presentDays = attendanceStats.present + (attendanceStats.halfDay * 0.5);
        const paidLeaveDays = attendanceStats.onLeave; // Assuming all leaves are paid for now
        const effectiveWorkDays = presentDays + paidLeaveDays + attendanceStats.holiday + attendanceStats.weekend;
        const absentDays = workingDaysInMonth - effectiveWorkDays;
        const unpaidAbsences = Math.max(0, absentDays);

        // Calculate earnings
        const grossSalary = config.calculateGrossSalary();
        const perDayRate = grossSalary / workingDaysInMonth;
        
        // Overtime calculation
        const overtimeHours = attendanceStats.totalOvertimeMinutes / 60;
        const overtimeMultiplier = orgSettings?.overtime?.rateMultiplier || 1.5;
        const overtimePay = overtimeHours * (config.perHourSalary * overtimeMultiplier);

        // Earnings breakdown
        const earningsComponents = config.components
            .filter(c => c.type === 'earning')
            .map(c => ({
                name: c.name,
                amount: c.isPercentage ? (config.basicSalary * c.amount / 100) : c.amount
            }));

        const totalEarnings = grossSalary + overtimePay;

        // Deductions
        const deductionComponents = config.components
            .filter(c => c.type === 'deduction')
            .map(c => ({
                name: c.name,
                amount: c.isPercentage ? (grossSalary * c.amount / 100) : c.amount
            }));

        const lossOfPay = unpaidAbsences * perDayRate;
        
        let pfDeduction = 0, esiDeduction = 0, ptDeduction = 0, tdsDeduction = 0;
        if (config.standardDeductions.pf.enabled) {
            pfDeduction = config.basicSalary * config.standardDeductions.pf.percentage / 100;
        }
        if (config.standardDeductions.esi.enabled) {
            esiDeduction = grossSalary * config.standardDeductions.esi.percentage / 100;
        }
        if (config.standardDeductions.professionalTax.enabled) {
            ptDeduction = config.standardDeductions.professionalTax.amount;
        }
        if (config.standardDeductions.tds.enabled) {
            tdsDeduction = grossSalary * config.standardDeductions.tds.percentage / 100;
        }

        const totalDeductions = lossOfPay + pfDeduction + esiDeduction + ptDeduction + tdsDeduction +
            deductionComponents.reduce((sum, d) => sum + d.amount, 0);

        const netSalary = totalEarnings - totalDeductions;

        // Create or update record
        if (!record) {
            record = new SalaryRecord({
                user: userId,
                company: companyId,
                month,
                year
            });
        }

        record.attendance = {
            workingDays: workingDaysInMonth,
            presentDays: attendanceStats.present,
            absentDays: unpaidAbsences,
            halfDays: attendanceStats.halfDay,
            paidLeaveDays,
            unpaidLeaveDays: attendanceStats.onLeave - paidLeaveDays,
            holidays: attendanceStats.holiday,
            weekends: attendanceStats.weekend,
            totalWorkingHours: attendanceStats.totalWorkingMinutes,
            overtimeHours: attendanceStats.totalOvertimeMinutes / 60,
            lateDays: attendanceStats.lateDays,
            earlyLeaveDays: attendanceStats.earlyLeaveDays
        };

        record.earnings = {
            basicSalary: config.basicSalary,
            components: earningsComponents,
            overtimePay,
            totalEarnings
        };

        record.deductions = {
            components: deductionComponents,
            lossOfPay,
            pf: pfDeduction,
            esi: esiDeduction,
            professionalTax: ptDeduction,
            tds: tdsDeduction,
            totalDeductions
        };

        record.grossSalary = grossSalary;
        record.netSalary = netSalary;
        record.generatedBy = req.user.id;
        record.paymentStatus = 'pending';

        await record.save();

        res.status(200).json({ success: true, record });
    } catch (error) {
        console.error('Generate salary record error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get salary records for a user
const getSalaryRecords = async (req, res) => {
    try {
        const { userId } = req.params;
        const companyId = req.user.company;
        const { year } = req.query;

        // Check access
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const query = { user: userId, company: companyId };
        if (year) query.year = parseInt(year);

        const records = await SalaryRecord.find(query)
            .sort({ year: -1, month: -1 })
            .populate('generatedBy', 'firstName lastName')
            .populate('approvedBy', 'firstName lastName');

        res.status(200).json({ success: true, records });
    } catch (error) {
        console.error('Get salary records error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark salary as paid
const markAsPaid = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { paymentMode, transactionId, notes } = req.body;
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const record = await SalaryRecord.findOne({ _id: recordId, company: companyId });
        if (!record) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        record.paymentStatus = 'paid';
        record.paymentDate = new Date();
        record.paymentMode = paymentMode;
        record.transactionId = transactionId;
        record.notes = notes;
        record.approvedBy = req.user.id;
        record.approvedAt = new Date();

        await record.save();

        res.status(200).json({ success: true, record });
    } catch (error) {
        console.error('Mark as paid error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all employee salaries for a month (Admin)
const getMonthlyPayroll = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { month, year } = req.query;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const queryMonth = parseInt(month) || new Date().getMonth();
        const queryYear = parseInt(year) || new Date().getFullYear();

        const records = await SalaryRecord.find({
            company: companyId,
            month: queryMonth,
            year: queryYear
        })
        .populate('user', 'firstName lastName email avatar designation')
        .sort({ 'user.firstName': 1 });

        const summary = {
            totalEmployees: records.length,
            totalGross: records.reduce((sum, r) => sum + r.grossSalary, 0),
            totalNet: records.reduce((sum, r) => sum + r.netSalary, 0),
            totalDeductions: records.reduce((sum, r) => sum + r.deductions.totalDeductions, 0),
            paid: records.filter(r => r.paymentStatus === 'paid').length,
            pending: records.filter(r => r.paymentStatus === 'pending').length
        };

        res.status(200).json({
            success: true,
            records,
            summary,
            period: { month: queryMonth, year: queryYear }
        });
    } catch (error) {
        console.error('Get monthly payroll error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSalaryConfig,
    upsertSalaryConfig,
    generateSalaryRecord,
    getSalaryRecords,
    markAsPaid,
    getMonthlyPayroll
};
