const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/subscription');
const Payment = require('../models/payment');
const Company = require('../models/company');
const User = require('../models/user');

// Initialize Razorpay (only if keys are configured)
let razorpay = null;
const initRazorpay = () => {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
};
initRazorpay();

// Constants
const BASE_PLAN_PRICE = parseInt(process.env.BASE_PLAN_PRICE) || 249;
const PER_USER_PRICE = parseInt(process.env.PER_USER_PRICE) || 50;
const BASE_PLAN_USER_LIMIT = parseInt(process.env.BASE_PLAN_USER_LIMIT) || 5;
const FREE_TRIAL_DAYS = parseInt(process.env.FREE_TRIAL_DAYS) || 90;

// Calculate subscription amount
const calculateSubscriptionAmount = (userCount) => {
    if (userCount <= BASE_PLAN_USER_LIMIT) {
        return BASE_PLAN_PRICE;
    }
    return BASE_PLAN_PRICE + ((userCount - BASE_PLAN_USER_LIMIT) * PER_USER_PRICE);
};

// Create Razorpay Order
const createOrder = async (req, res) => {
    try {
        const { userCount } = req.body;
        const companyId = req.user.company;

        // Validate user role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only company admins can manage payments' });
        }

        const count = userCount || 1;
        const amount = calculateSubscriptionAmount(count);
        const amountInPaise = amount * 100;

        // Get company details
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Create Razorpay order
        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${companyId}_${Date.now()}`,
            notes: {
                companyId: companyId.toString(),
                userCount: count,
                companyName: company.companyName
            }
        };

        const order = await razorpay.orders.create(orderOptions);

        // Create pending payment record
        const invoiceNumber = await Payment.generateInvoiceNumber();
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const payment = await Payment.create({
            company: companyId,
            subscription: company.subscription,
            amount: amount,
            currency: 'INR',
            status: 'pending',
            razorpayOrderId: order.id,
            invoiceNumber,
            description: `ForaTask Subscription - ${count} users`,
            userCountAtPayment: count,
            billingPeriodStart: now,
            billingPeriodEnd: periodEnd
        });

        res.status(200).json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            paymentId: payment._id,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Verify Payment
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Find and update payment
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // Get payment details from Razorpay
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'success';
        payment.paymentMethod = razorpayPayment.method;
        payment.paymentDate = new Date();
        await payment.save();

        // Update subscription
        const subscription = await Subscription.findOne({ company: payment.company });
        if (subscription) {
            const now = new Date();
            const billingAnchorDay = now.getDate();
            
            subscription.status = 'active';
            subscription.planType = 'paid';
            subscription.currentUserCount = payment.userCountAtPayment;
            subscription.totalAmount = payment.amount;
            subscription.subscriptionStartDate = subscription.subscriptionStartDate || now;
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = payment.billingPeriodEnd;
            subscription.nextBillingDate = payment.billingPeriodEnd;
            subscription.billingAnchorDay = billingAnchorDay;
            subscription.lastPaymentDate = now;
            subscription.lastPaymentAmount = payment.amount;
            subscription.lastPaymentStatus = 'success';
            
            // Reset expiry notifications
            subscription.expiryNotificationsSent = {
                sevenDay: false,
                threeDay: false,
                oneDay: false,
                expired: false
            };
            
            await subscription.save();
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            payment: {
                id: payment._id,
                amount: payment.amount,
                invoiceNumber: payment.invoiceNumber,
                status: payment.status
            }
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create Subscription (for new companies during registration)
const createSubscription = async (req, res) => {
    try {
        const { companyId, startTrial = true } = req.body;

        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({ company: companyId });
        if (existingSubscription) {
            return res.status(400).json({ message: 'Subscription already exists for this company' });
        }

        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + FREE_TRIAL_DAYS);

        const subscription = await Subscription.create({
            company: companyId,
            status: startTrial ? 'trial' : 'active',
            planType: startTrial ? 'free_trial' : 'paid',
            currentUserCount: 1,
            basePrice: BASE_PLAN_PRICE,
            perUserPrice: PER_USER_PRICE,
            basePlanUserLimit: BASE_PLAN_USER_LIMIT,
            totalAmount: 0,
            trialStartDate: startTrial ? now : null,
            trialEndDate: startTrial ? trialEndDate : null
        });

        // Update company with subscription reference
        await Company.findByIdAndUpdate(companyId, { subscription: subscription._id });

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            subscription: {
                id: subscription._id,
                status: subscription.status,
                planType: subscription.planType,
                trialEndDate: subscription.trialEndDate
            }
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update Subscription (when users are added/removed)
const updateSubscription = async (req, res) => {
    try {
        const { userCount } = req.body;
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only company admins can update subscriptions' });
        }

        const subscription = await Subscription.findOne({ company: companyId });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const newAmount = calculateSubscriptionAmount(userCount);
        
        subscription.currentUserCount = userCount;
        subscription.totalAmount = newAmount;
        await subscription.save();

        // Update company user count
        await Company.findByIdAndUpdate(companyId, { currentPlanUserCount: userCount });

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            subscription: {
                id: subscription._id,
                currentUserCount: subscription.currentUserCount,
                totalAmount: subscription.totalAmount,
                nextBillingDate: subscription.nextBillingDate
            }
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Cancel Subscription
const cancelSubscription = async (req, res) => {
    try {
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only company admins can cancel subscriptions' });
        }

        const subscription = await Subscription.findOne({ company: companyId });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // No refunds for partial months as per business rules
        subscription.status = 'cancelled';
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully. Note: No refunds for partial billing periods.',
            subscription: {
                id: subscription._id,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd
            }
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Invoice History
const getInvoiceHistory = async (req, res) => {
    try {
        const companyId = req.user.company;
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const skip = page * limit;

        const payments = await Payment.find({ 
            company: companyId,
            status: { $in: ['success', 'refunded'] }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments({ 
            company: companyId,
            status: { $in: ['success', 'refunded'] }
        });

        res.status(200).json({
            success: true,
            invoices: payments.map(p => ({
                id: p._id,
                invoiceNumber: p.invoiceNumber,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                paymentMethod: p.paymentMethod,
                paymentDate: p.paymentDate,
                billingPeriodStart: p.billingPeriodStart,
                billingPeriodEnd: p.billingPeriodEnd,
                userCount: p.userCountAtPayment,
                description: p.description
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get invoice history error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Webhook Handler
const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log('Razorpay webhook event:', event);

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;
            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;
            case 'subscription.charged':
                await handleSubscriptionCharged(payload);
                break;
            case 'subscription.cancelled':
                await handleSubscriptionCancelled(payload);
                break;
            default:
                console.log('Unhandled webhook event:', event);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Webhook helper functions
const handlePaymentCaptured = async (payload) => {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment && payment.status === 'pending') {
        payment.status = 'success';
        payment.razorpayPaymentId = paymentEntity.id;
        payment.paymentMethod = paymentEntity.method;
        payment.paymentDate = new Date();
        await payment.save();

        // Update subscription
        const subscription = await Subscription.findOne({ company: payment.company });
        if (subscription) {
            subscription.lastPaymentStatus = 'success';
            subscription.lastPaymentDate = new Date();
            subscription.lastPaymentAmount = payment.amount;
            await subscription.save();
        }
    }
};

const handlePaymentFailed = async (payload) => {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment) {
        payment.status = 'failed';
        payment.razorpayPaymentId = paymentEntity.id;
        payment.failureReason = paymentEntity.error_description || 'Payment failed';
        await payment.save();

        // Update subscription
        const subscription = await Subscription.findOne({ company: payment.company });
        if (subscription) {
            subscription.lastPaymentStatus = 'failed';
            await subscription.save();
        }
    }
};

const handleSubscriptionCharged = async (payload) => {
    // Handle recurring subscription payments
    const subscriptionEntity = payload.subscription.entity;
    const notes = subscriptionEntity.notes || {};
    const companyId = notes.companyId;

    if (companyId) {
        const subscription = await Subscription.findOne({ company: companyId });
        if (subscription) {
            subscription.lastPaymentDate = new Date();
            subscription.lastPaymentStatus = 'success';
            subscription.status = 'active';
            await subscription.save();
        }
    }
};

const handleSubscriptionCancelled = async (payload) => {
    const subscriptionEntity = payload.subscription.entity;
    const notes = subscriptionEntity.notes || {};
    const companyId = notes.companyId;

    if (companyId) {
        const subscription = await Subscription.findOne({ company: companyId });
        if (subscription) {
            subscription.status = 'cancelled';
            await subscription.save();
        }
    }
};

// Get Subscription Status
const getSubscriptionStatus = async (req, res) => {
    try {
        const companyId = req.user.company;

        const subscription = await Subscription.findOne({ company: companyId });
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const daysUntilExpiry = subscription.getDaysUntilExpiry();
        const amount = subscription.calculateAmount();

        res.status(200).json({
            success: true,
            subscription: {
                id: subscription._id,
                status: subscription.status,
                planType: subscription.planType,
                currentUserCount: subscription.currentUserCount,
                totalAmount: amount,
                trialEndDate: subscription.trialEndDate,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                nextBillingDate: subscription.nextBillingDate,
                daysUntilExpiry,
                isManuallyRestricted: subscription.isManuallyRestricted,
                restrictionReason: subscription.restrictionReason
            },
            pricing: {
                basePrice: BASE_PLAN_PRICE,
                perUserPrice: PER_USER_PRICE,
                basePlanUserLimit: BASE_PLAN_USER_LIMIT
            }
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Calculate Price Preview
const calculatePrice = async (req, res) => {
    try {
        const { userCount } = req.query;
        const count = parseInt(userCount) || 1;
        const amount = calculateSubscriptionAmount(count);

        res.status(200).json({
            success: true,
            pricing: {
                userCount: count,
                basePrice: BASE_PLAN_PRICE,
                perUserPrice: PER_USER_PRICE,
                basePlanUserLimit: BASE_PLAN_USER_LIMIT,
                totalAmount: amount,
                breakdown: count <= BASE_PLAN_USER_LIMIT 
                    ? `Base plan: ₹${BASE_PLAN_PRICE}`
                    : `Base plan (${BASE_PLAN_USER_LIMIT} users): ₹${BASE_PLAN_PRICE} + Additional ${count - BASE_PLAN_USER_LIMIT} users: ₹${(count - BASE_PLAN_USER_LIMIT) * PER_USER_PRICE}`
            }
        });
    } catch (error) {
        console.error('Calculate price error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getInvoiceHistory,
    handleWebhook,
    getSubscriptionStatus,
    calculatePrice
};
