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
                formattedBreakdown: config.getFormattedBreakdown()
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
        const { totalSalary, breakdown } = req.body;
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        let config = await SalaryConfig.findOne({ user: userId, company: companyId });

        if (!config) {
            config = new SalaryConfig({
                user: userId,
                company: companyId
            });
        }

        config.totalSalary = totalSalary !== undefined ? totalSalary : config.totalSalary;
        config.breakdown = breakdown || config.breakdown;
        
        await config.save();

        res.status(200).json({
            success: true,
            message: 'Salary configuration saved',
            config
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

        const config = await SalaryConfig.findOne({ user: userId, company: companyId });
        if (!config) {
            return res.status(404).json({ message: 'Salary configuration not found' });
        }

        // Get organization settings for working days
        const orgSettings = await OrganizationSettings.findOne({ company: companyId });
        const workingDaysInMonth = orgSettings ? 
            orgSettings.getWorkingDaysInMonth(year, month) : 22;

        // Get attendance stats
        const attendanceStats = await Attendance.getMonthlyStats(userId, year, month);

        // Logic: No additions or subtractions, just parts. Only Loss of Pay (LOP) from absences reduces total.
        const perDayRate = config.totalSalary / workingDaysInMonth;
        
        const presentDays = attendanceStats.present + (attendanceStats.halfDay * 0.5);
        const paidLeaveDays = attendanceStats.onLeave; // For now all leaves are paid
        const nonWorkingDays = attendanceStats.holiday + attendanceStats.weekend;
        
        const effectiveDays = presentDays + paidLeaveDays + nonWorkingDays;
        const unpaidAbsences = Math.max(0, workingDaysInMonth - effectiveDays);
        
        const lossOfPay = unpaidAbsences * perDayRate;
        const netSalary = config.totalSalary - lossOfPay;

        const breakdownValues = config.getFormattedBreakdown();

        let record = await SalaryRecord.findOne({ user: userId, month, year });
        if (record && record.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Salary already paid' });
        }

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
            totalWorkingHours: attendanceStats.totalWorkingMinutes / 60
        };

        record.earnings = {
            basicSalary: config.totalSalary,
            components: breakdownValues.map(b => ({ name: b.name, amount: b.value })),
            totalEarnings: config.totalSalary
        };

        record.deductions = {
            lossOfPay,
            totalDeductions: lossOfPay
        };

        record.grossSalary = config.totalSalary;
        record.netSalary = netSalary;
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

        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const query = { user: userId, company: companyId };
        if (year) query.year = parseInt(year);

        const records = await SalaryRecord.find(query).sort({ year: -1, month: -1 });
        res.status(200).json({ success: true, records });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark as paid
const markAsPaid = async (req, res) => {
    try {
        const { recordId } = req.params;
        const companyId = req.user.company;

        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

        const record = await SalaryRecord.findOne({ _id: recordId, company: companyId });
        if (!record) return res.status(404).json({ message: 'Not found' });

        record.paymentStatus = 'paid';
        record.paymentDate = new Date();
        await record.save();

        res.status(200).json({ success: true, record });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMonthlyPayroll = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { month, year } = req.query;
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

        const queryMonth = parseInt(month) || new Date().getMonth();
        const queryYear = parseInt(year) || new Date().getFullYear();

        const records = await SalaryRecord.find({ company: companyId, month: queryMonth, year: queryYear })
            .populate('user', 'firstName lastName email designation');

        res.status(200).json({ success: true, records });
    } catch (error) {
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
