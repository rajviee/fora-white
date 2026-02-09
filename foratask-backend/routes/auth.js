const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/user");
const Company = require('../models/company');
const jwt = require("jsonwebtoken");
const upload = require("../middleware/uploadAvatarMiddleware");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "jwt-token-foratask";

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
    const token = jwt.sign({ id: user._id, role: user.role, subordinates: user.subordinates, supervisor: user.supervisor, company: user.company }, JWT_SECRET, { expiresIn: "90d" });
    console.log('user id = ', user._id, ' user role = ', user.role, ' subordinates = ', user.subordinates, ' supervisor= ', user.supervisor, 'company= ', user.company);
    res.status(200).json({ message: "Login Successful", token });
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
      companyContactNumber
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
    });

    const newCompany = await Company.create({
      companyEmail,
      companyName,
      owners: [newUser._id],
      companyContactNumber
    });

    await User.findByIdAndUpdate(newUser._id, { $set: { company: newCompany._id } });
    res.status(201).json({ message: "Company and admin user registered successfully", userId: newUser._id, companyId: newCompany._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;