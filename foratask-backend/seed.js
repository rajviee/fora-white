const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/user');
const Company = require('./models/company');
const Subscription = require('./models/subscription');
const OrganizationSettings = require('./models/organizationSettings');

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Check if company already exists
  const existing = await Company.findOne({ companyEmail: 'info@varientworld.com' });
  if (existing) {
    console.log('Varient Worldwide already seeded. Skipping.');
    await mongoose.disconnect();
    return;
  }

  // Create company
  const company = await Company.create({
    companyEmail: 'info@varientworld.com',
    companyName: 'Varient Worldwide',
    companyAddress: 'Ahmedabad, India',
    companyContactNumber: '+919876543210',
  });
  console.log('Company created:', company.companyName);

  // Create subscription (90-day free trial)
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 90);

  const subscription = await Subscription.create({
    company: company._id,
    status: 'trial',
    planType: 'free_trial',
    currentUserCount: 3,
    basePrice: 249,
    perUserPrice: 50,
    basePlanUserLimit: 5,
    totalAmount: 0,
    trialStartDate: now,
    trialEndDate: trialEnd,
  });

  await Company.findByIdAndUpdate(company._id, { subscription: subscription._id });

  // Create users
  const users = [
    { firstName: 'Rajvi', lastName: 'Admin', email: 'rajvi@varientworld.com', password: 'Rajvi@123', role: 'admin', designation: 'Company Admin' },
    { firstName: 'Shubh', lastName: 'Supervisor', email: 'shubh@varientworld.com', password: 'Shubh@123', role: 'supervisor', designation: 'Team Lead' },
    { firstName: 'Tushar', lastName: 'Developer', email: 'developers1@varientworld.com', password: 'Tushar@123', role: 'employee', designation: 'Developer' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const newUser = await User.create({
      ...u,
      password: hashed,
      company: company._id,
    });
    createdUsers.push(newUser);
    console.log(`User created: ${u.firstName} (${u.role}) - ${u.email}`);
  }

  // Update company owners and employees
  await Company.findByIdAndUpdate(company._id, {
    owners: [createdUsers[0]._id],
    employees: createdUsers.map(u => u._id),
  });

  // Set supervisor-subordinate relationship
  await User.findByIdAndUpdate(createdUsers[1]._id, {
    subordinates: [createdUsers[2]._id],
  });
  await User.findByIdAndUpdate(createdUsers[2]._id, {
    supervisor: createdUsers[1]._id,
  });

  // Create organization settings
  await OrganizationSettings.create({
    company: company._id,
    workingHours: {
      startTime: '09:00',
      endTime: '18:00',
      totalHours: 9,
    },
    workingDays: {
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false,
    },
    attendance: {
      lateToleranceMinutes: 15,
      earlyLeaveToleranceMinutes: 15,
      requireGeotag: true,
      allowRemoteAttendance: true,
    },
    officeLocations: [{
      name: 'Main Office',
      address: 'Ahmedabad, India',
      coordinates: { latitude: 23.0225, longitude: 72.5714 },
      geofenceRadius: 300,
      isPrimary: true,
    }],
  });
  console.log('Organization settings created');

  console.log('\nSeed complete!');
  console.log('Credentials:');
  console.log('  Rajvi (Admin): rajvi@varientworld.com / Rajvi@123');
  console.log('  Shubh (Supervisor): shubh@varientworld.com / Shubh@123');
  console.log('  Tushar (Employee): developers1@varientworld.com / Tushar@123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
