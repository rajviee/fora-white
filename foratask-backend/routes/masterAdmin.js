const express = require('express');
const router = express.Router();
const {
    login,
    getDashboardStats,
    getCompanies,
    getCompanyDetails,
    restrictCompany,
    unrestrictCompany,
    extendTrial,
    getAllPayments,
    getRevenueAnalytics,
    getProfile
} = require('../controllers/masterAdminController');
const masterAdminAuth = require('../middleware/masterAdminAuth');

// Public route - Login
router.post('/login', login);

// Protected routes
router.use(masterAdminAuth);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Profile
router.get('/profile', getProfile);

// Companies management
router.get('/companies', getCompanies);
router.get('/companies/:companyId', getCompanyDetails);
router.post('/companies/:companyId/restrict', restrictCompany);
router.post('/companies/:companyId/unrestrict', unrestrictCompany);
router.post('/companies/:companyId/extend-trial', extendTrial);

// Payments
router.get('/payments', getAllPayments);
router.get('/analytics/revenue', getRevenueAnalytics);

module.exports = router;
