const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MasterAdmin = require('../models/masterAdmin');
const Company = require('../models/company');
const Subscription = require('../models/subscription');
const Payment = require('../models/payment');
const User = require('../models/user');
const Task = require('../models/task');

const MASTER_ADMIN_JWT_SECRET = process.env.MASTER_ADMIN_JWT_SECRET || 'master-admin-secret-key';

// Master Admin Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await MasterAdmin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { 
                id: admin._id, 
                role: 'master-admin',
                email: admin.email
            },
            MASTER_ADMIN_JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        console.error('Master admin login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Total companies
        const totalCompanies = await Company.countDocuments({ isActive: true });

        // Subscription stats
        const subscriptionStats = await Subscription.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const subscriptions = {
            trial: 0,
            active: 0,
            expired: 0,
            cancelled: 0
        };
        subscriptionStats.forEach(stat => {
            subscriptions[stat._id] = stat.count;
        });

        // Total users
        const totalUsers = await User.countDocuments({ role: { $ne: 'master-admin' } });

        // Monthly Recurring Revenue (MRR)
        const activeSubscriptions = await Subscription.find({ status: 'active' });
        const mrr = activeSubscriptions.reduce((total, sub) => {
            return total + sub.calculateAmount();
        }, 0);

        // Recent payments
        const recentPayments = await Payment.find({ status: 'success' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('company', 'companyName');

        // Failed payments in last 30 days
        const failedPayments = await Payment.countDocuments({
            status: 'failed',
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Recent signups
        const recentSignups = await Company.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('companyName companyEmail createdAt')
            .populate('subscription', 'status planType');

        // Revenue this month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const revenueThisMonth = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Trial to paid conversion rate
        const convertedTrials = await Subscription.countDocuments({
            planType: 'paid',
            trialStartDate: { $ne: null }
        });
        const totalTrials = await Subscription.countDocuments({
            trialStartDate: { $ne: null }
        });
        const conversionRate = totalTrials > 0 ? ((convertedTrials / totalTrials) * 100).toFixed(1) : 0;

        // Churn rate (cancelled in last 30 days / active 30 days ago)
        const cancelledRecently = await Subscription.countDocuments({
            status: 'cancelled',
            updatedAt: { $gte: thirtyDaysAgo }
        });
        const churnRate = subscriptions.active > 0 
            ? ((cancelledRecently / (subscriptions.active + cancelledRecently)) * 100).toFixed(1) 
            : 0;

        res.status(200).json({
            success: true,
            stats: {
                totalCompanies,
                totalUsers,
                subscriptions,
                mrr,
                revenueThisMonth: revenueThisMonth[0]?.total || 0,
                failedPayments,
                conversionRate: parseFloat(conversionRate),
                churnRate: parseFloat(churnRate),
                recentSignups,
                recentPayments: recentPayments.map(p => ({
                    id: p._id,
                    company: p.company?.companyName,
                    amount: p.amount,
                    date: p.createdAt,
                    invoiceNumber: p.invoiceNumber
                }))
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get All Companies
const getCompanies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const skip = page * limit;
        const search = req.query.search;
        const status = req.query.status; // trial, active, expired, cancelled

        let query = { isActive: true };

        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { companyEmail: { $regex: search, $options: 'i' } }
            ];
        }

        let companies = await Company.find(query)
            .populate('subscription')
            .populate('owners', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Filter by subscription status if provided
        if (status) {
            companies = companies.filter(c => c.subscription?.status === status);
        }

        const total = await Company.countDocuments(query);

        res.status(200).json({
            success: true,
            companies: companies.map(c => ({
                id: c._id,
                companyName: c.companyName,
                companyEmail: c.companyEmail,
                contactNumber: c.companyContactNumber,
                createdAt: c.createdAt,
                owners: c.owners,
                employeeCount: c.employees?.length || 0,
                subscription: c.subscription ? {
                    id: c.subscription._id,
                    status: c.subscription.status,
                    planType: c.subscription.planType,
                    currentUserCount: c.subscription.currentUserCount,
                    totalAmount: c.subscription.calculateAmount(),
                    trialEndDate: c.subscription.trialEndDate,
                    currentPeriodEnd: c.subscription.currentPeriodEnd,
                    isManuallyRestricted: c.subscription.isManuallyRestricted
                } : null
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Company Details
const getCompanyDetails = async (req, res) => {
    try {
        const { companyId } = req.params;

        const company = await Company.findById(companyId)
            .populate('subscription')
            .populate('owners', 'firstName lastName email contactNumber')
            .populate('employees', 'firstName lastName email role designation');

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Get payment history
        const payments = await Payment.find({ company: companyId })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get task statistics
        const taskStats = await Task.aggregate([
            { $match: { company: company._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const tasks = {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0
        };
        taskStats.forEach(stat => {
            tasks.total += stat.count;
            if (stat._id === 'Completed') tasks.completed = stat.count;
            if (stat._id === 'Pending' || stat._id === 'In Progress') tasks.pending += stat.count;
            if (stat._id === 'Overdue') tasks.overdue = stat.count;
        });

        res.status(200).json({
            success: true,
            company: {
                id: company._id,
                companyName: company.companyName,
                companyEmail: company.companyEmail,
                companyAddress: company.companyAddress,
                companyContactNumber: company.companyContactNumber,
                companyGSTNumber: company.companyGSTNumber,
                companyPANNumber: company.companyPANNumber,
                createdAt: company.createdAt,
                isActive: company.isActive,
                owners: company.owners,
                employees: company.employees,
                employeeCount: company.employees?.length || 0
            },
            subscription: company.subscription ? {
                id: company.subscription._id,
                status: company.subscription.status,
                planType: company.subscription.planType,
                currentUserCount: company.subscription.currentUserCount,
                totalAmount: company.subscription.calculateAmount(),
                trialStartDate: company.subscription.trialStartDate,
                trialEndDate: company.subscription.trialEndDate,
                subscriptionStartDate: company.subscription.subscriptionStartDate,
                currentPeriodStart: company.subscription.currentPeriodStart,
                currentPeriodEnd: company.subscription.currentPeriodEnd,
                nextBillingDate: company.subscription.nextBillingDate,
                lastPaymentDate: company.subscription.lastPaymentDate,
                lastPaymentAmount: company.subscription.lastPaymentAmount,
                lastPaymentStatus: company.subscription.lastPaymentStatus,
                isManuallyRestricted: company.subscription.isManuallyRestricted,
                restrictionReason: company.subscription.restrictionReason
            } : null,
            payments: payments.map(p => ({
                id: p._id,
                invoiceNumber: p.invoiceNumber,
                amount: p.amount,
                status: p.status,
                paymentDate: p.paymentDate,
                createdAt: p.createdAt
            })),
            taskStats: tasks
        });
    } catch (error) {
        console.error('Get company details error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Restrict Company
const restrictCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { reason } = req.body;
        const adminId = req.masterAdmin.id;

        const subscription = await Subscription.findOne({ company: companyId });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        subscription.isManuallyRestricted = true;
        subscription.restrictionReason = reason || 'Restricted by administrator';
        subscription.restrictedAt = new Date();
        subscription.restrictedBy = adminId;
        await subscription.save();

        // Log activity
        const admin = await MasterAdmin.findById(adminId);
        await admin.logActivity('restrict_company', 'Company', companyId, { reason }, req.ip);

        res.status(200).json({
            success: true,
            message: 'Company restricted successfully'
        });
    } catch (error) {
        console.error('Restrict company error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Unrestrict Company
const unrestrictCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const adminId = req.masterAdmin.id;

        const subscription = await Subscription.findOne({ company: companyId });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        subscription.isManuallyRestricted = false;
        subscription.restrictionReason = null;
        subscription.restrictedAt = null;
        subscription.restrictedBy = null;
        await subscription.save();

        // Log activity
        const admin = await MasterAdmin.findById(adminId);
        await admin.logActivity('unrestrict_company', 'Company', companyId, {}, req.ip);

        res.status(200).json({
            success: true,
            message: 'Company unrestricted successfully'
        });
    } catch (error) {
        console.error('Unrestrict company error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Extend Trial
const extendTrial = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { days } = req.body;
        const adminId = req.masterAdmin.id;

        if (!days || days < 1) {
            return res.status(400).json({ message: 'Invalid number of days' });
        }

        const subscription = await Subscription.findOne({ company: companyId });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status !== 'trial' && subscription.status !== 'expired') {
            return res.status(400).json({ message: 'Can only extend trial for trial or expired subscriptions' });
        }

        const currentEndDate = subscription.trialEndDate || new Date();
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + days);

        subscription.trialEndDate = newEndDate;
        subscription.status = 'trial';
        subscription.expiryNotificationsSent = {
            sevenDay: false,
            threeDay: false,
            oneDay: false,
            expired: false
        };
        await subscription.save();

        // Log activity
        const admin = await MasterAdmin.findById(adminId);
        await admin.logActivity('extend_trial', 'Subscription', subscription._id, { days, newEndDate }, req.ip);

        res.status(200).json({
            success: true,
            message: `Trial extended by ${days} days`,
            newEndDate
        });
    } catch (error) {
        console.error('Extend trial error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get All Payments
const getAllPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const skip = page * limit;
        const status = req.query.status;

        let query = {};
        if (status) {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate('company', 'companyName companyEmail')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments(query);

        // Calculate totals
        const totals = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalPayments: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            payments: payments.map(p => ({
                id: p._id,
                company: p.company,
                invoiceNumber: p.invoiceNumber,
                amount: p.amount,
                status: p.status,
                paymentMethod: p.paymentMethod,
                paymentDate: p.paymentDate,
                createdAt: p.createdAt,
                razorpayPaymentId: p.razorpayPaymentId,
                failureReason: p.failureReason
            })),
            totals: totals[0] || { totalRevenue: 0, totalPayments: 0 },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Revenue Analytics
const getRevenueAnalytics = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

        const monthlyRevenue = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format data for charts
        const chartData = monthlyRevenue.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            revenue: item.revenue,
            transactions: item.count
        }));

        res.status(200).json({
            success: true,
            analytics: chartData
        });
    } catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Master Admin Profile
const getProfile = async (req, res) => {
    try {
        const adminId = req.masterAdmin.id;
        const admin = await MasterAdmin.findById(adminId).select('-password -activityLog');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({
            success: true,
            admin: {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                role: admin.role,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
                permissions: admin.permissions,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Seed default master admin
const seedMasterAdmin = async () => {
    try {
        const existingAdmin = await MasterAdmin.findOne({ 
            email: process.env.MASTER_ADMIN_DEFAULT_EMAIL 
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(
                process.env.MASTER_ADMIN_DEFAULT_PASSWORD || 'Varient23@123',
                10
            );

            await MasterAdmin.create({
                email: process.env.MASTER_ADMIN_DEFAULT_EMAIL || 'admin@foratask.com',
                password: hashedPassword,
                firstName: 'Master',
                lastName: 'Admin',
                role: 'master-admin',
                isActive: true
            });

            console.log('✅ Master admin seeded successfully');
        }
    } catch (error) {
        console.error('Seed master admin error:', error);
    }
};

module.exports = {
    login,
    getDashboardStats,
    getCompanies,
    getCompanyDetails,
    restrictCompany,
    unrestrictCompany,
    extendTrial,
    getAllPayments,
    getRevenueAnalytics,
    getProfile,
    seedMasterAdmin
};
