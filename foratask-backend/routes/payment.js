const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getInvoiceHistory,
    handleWebhook,
    getSubscriptionStatus,
    calculatePrice
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route - Webhook (no auth required, uses signature verification)
router.post('/webhook', express.json(), handleWebhook);

// Price calculator (public)
router.get('/calculate-price', calculatePrice);

// Protected routes
router.use(authMiddleware);

// Order and payment
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

// Subscription management
router.post('/create-subscription', createSubscription);
router.patch('/update-subscription', updateSubscription);
router.post('/cancel-subscription', cancelSubscription);
router.get('/subscription-status', getSubscriptionStatus);

// Invoice history
router.get('/invoice-history', getInvoiceHistory);

module.exports = router;
