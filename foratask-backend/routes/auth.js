const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/user");
const Company = require('../models/company');
const Subscription = require('../models/subscription');
const jwt = require("jsonwebtoken");
const upload = require("../middleware/uploadAvatarMiddleware");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "jwt-token-foratask";
const FREE_TRIAL_DAYS = parseInt(process.env.FREE_TRIAL_DAYS) || 90;

router.post('/login', async (req, res) => {
  try {
    console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email or Password may be wrong" });
    }
    
    // Get subscription status for response
    let subscriptionInfo = null;
    if (user.company) {
      const subscription = await Subscription.findOne({ company: user.company });
      if (subscription) {
        subscriptionInfo = {
          status: subscription.status,
          planType: subscription.planType,
          daysUntilExpiry: subscription.getDaysUntilExpiry(),
          isManuallyRestricted: subscription.isManuallyRestricted
        };
      }
    }
    
    const token = jwt.sign({ id: user._id, role: user.role, subordinates: user.subordinates, supervisor: user.supervisor, company: user.company }, JWT_SECRET, { expiresIn: "90d" });
    console.log('user id = ', user._id, ' user role = ', user.role, ' subordinates = ', user.subordinates, ' supervisor= ', user.supervisor, 'company= ', user.company);
    res.status(200).json({ message: "Login Successful", token, subscription: subscriptionInfo });
  }
  catch (err) {
    res.status(500).json({ error: err.message })
  }
});

// POST /api/auth/register
router.post("/register", upload.single('avatar'), async (req, res) => {
  try {
    let {
      email,
      password,
      firstName,
      lastName,
      avatar,
      contactNumber,
      dateOfBirth,
      gender,
      designation,
      companyEmail,
      companyName,
      companyContactNumber,
      companyAddress
    } = req.body;

    if (req.file) {
      avatar = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        size: req.file.size,
        mimeType: req.file.mimetype,
        fileExtension: path.extname(req.file.originalname),
      };
    }
    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Check if company email already exists
    const existingCompany = await Company.findOne({ companyEmail });
    if (existingCompany) {
      return res.status(400).json({ message: "Company with this email already exists" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)[A-Za-z\d\W]{8,}$/ ;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!companyEmail || !companyName || !companyContactNumber) {
      return res.status(400).json({
        message: "Missing required fields: companyEmail, companyName, and companyContactNumber are required."
      });
    }
    
    // Create company first
    const newCompany = await Company.create({
      companyEmail,
      companyName,
      companyAddress: companyAddress || null,
      companyContactNumber
    });
    
    // create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      avatar,
      contactNumber,
      dateOfBirth,
      gender,
      role: 'admin',
      designation,
      company: newCompany._id
    });
    
    // Update company with owner
    await Company.findByIdAndUpdate(newCompany._id, { 
      $push: { owners: newUser._id } 
    });

    // Create subscription with free trial
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + FREE_TRIAL_DAYS);

    const subscription = await Subscription.create({
      company: newCompany._id,
      status: 'trial',
      planType: 'free_trial',
      currentUserCount: 1,
      basePrice: parseInt(process.env.BASE_PLAN_PRICE) || 249,
      perUserPrice: parseInt(process.env.PER_USER_PRICE) || 50,
      basePlanUserLimit: parseInt(process.env.BASE_PLAN_USER_LIMIT) || 5,
      totalAmount: 0,
      trialStartDate: now,
      trialEndDate: trialEndDate
    });

    // Update company with subscription reference
    await Company.findByIdAndUpdate(newCompany._id, { subscription: subscription._id });

    res.status(201).json({ 
      message: "Company and admin user registered successfully", 
      userId: newUser._id, 
      companyId: newCompany._id,
      subscriptionId: subscription._id,
      trialEndDate: trialEndDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;