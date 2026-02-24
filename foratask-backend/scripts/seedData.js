const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/user');
const Company = require('./models/company');
const Subscription = require('./models/subscription');
const OrganizationSettings = require('./models/organizationSettings');
const SalaryConfig = require('./models/salaryConfig');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foratask';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if Varient Worldwide already exists
        const existingCompany = await Company.findOne({ companyEmail: 'info@varientworld.com' });
        if (existingCompany) {
            console.log('⚠️ Varient Worldwide already exists. Skipping seed.');
            await mongoose.disconnect();
            return;
        }

        console.log('🌱 Starting seed...');

        // 1. Create Company: Varient Worldwide
        const company = await Company.create({
            companyName: 'Varient Worldwide',
            companyEmail: 'info@varientworld.com',
            companyContactNumber: '+919876543210',
            companyAddress: 'Ahmedabad, Gujarat, India',
            isActive: true
        });
        console.log('✅ Company created: Varient Worldwide');

        // 2. Create Subscription (90-day trial)
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + 90);

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
            trialEndDate: trialEndDate
        });

        await Company.findByIdAndUpdate(company._id, { subscription: subscription._id });
        console.log('✅ Subscription created with 90-day trial');

        // 3. Create Organization Settings
        const orgSettings = await OrganizationSettings.create({
            company: company._id,
            workingDays: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
            },
            workingHours: {
                startTime: '09:00',
                endTime: '18:00',
                breakDuration: 60,
                totalHours: 8
            },
            tasksRemoteByDefault: false,
            officeLocations: [{
                name: 'Varient HQ',
                address: 'Ahmedabad, Gujarat, India',
                coordinates: {
                    latitude: 23.0225,
                    longitude: 72.5714
                },
                geofenceRadius: 300,
                isPrimary: true
            }],
            attendance: {
                requireGeotag: true,
                allowRemoteAttendance: true,
                autoDetectLocation: true,
                lateToleranceMinutes: 15,
                earlyLeaveToleranceMinutes: 15
            },
            leave: {
                paidLeavesPerMonth: 1.5,
                carryForwardLimit: 5,
                allowHalfDay: true
            }
        });
        console.log('✅ Organization settings created');

        // 4. Create Users
        const users = [
            {
                email: 'rajvi@varientworld.com',
                password: 'Rajvi@123',
                firstName: 'Rajvi',
                lastName: 'Patel',
                role: 'admin',
                designation: 'CEO & Founder',
                contactNumber: '+919876543211'
            },
            {
                email: 'shubh@varientworld.com',
                password: 'Shubh@123',
                firstName: 'Shubh',
                lastName: 'Shah',
                role: 'supervisor',
                designation: 'Project Manager',
                contactNumber: '+919876543212'
            },
            {
                email: 'developers1@varientworld.com',
                password: 'Tushar@123',
                firstName: 'Tushar',
                lastName: 'Mehta',
                role: 'employee',
                designation: 'Software Developer',
                contactNumber: '+919876543213'
            }
        ];

        const createdUsers = [];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({
                ...userData,
                password: hashedPassword,
                company: company._id
            });
            createdUsers.push(user);
            console.log(`✅ User created: ${userData.firstName} ${userData.lastName} (${userData.role})`);
        }

        // Update company owners and employees
        await Company.findByIdAndUpdate(company._id, {
            owners: [createdUsers[0]._id],
            employees: [createdUsers[1]._id, createdUsers[2]._id]
        });

        // Set supervisor relationship
        await User.findByIdAndUpdate(createdUsers[1]._id, {
            subordinates: [createdUsers[2]._id]
        });
        await User.findByIdAndUpdate(createdUsers[2]._id, {
            supervisor: createdUsers[1]._id
        });
        console.log('✅ User relationships established');

        // 5. Create Salary Configs
        const salaryConfigs = [
            {
                user: createdUsers[0]._id,
                basicSalary: 100000,
                components: [
                    { name: 'HRA', type: 'earning', amount: 40, isPercentage: true, isFixed: true },
                    { name: 'Conveyance', type: 'earning', amount: 5000, isPercentage: false, isFixed: true }
                ]
            },
            {
                user: createdUsers[1]._id,
                basicSalary: 60000,
                components: [
                    { name: 'HRA', type: 'earning', amount: 40, isPercentage: true, isFixed: true },
                    { name: 'Conveyance', type: 'earning', amount: 3000, isPercentage: false, isFixed: true }
                ]
            },
            {
                user: createdUsers[2]._id,
                basicSalary: 40000,
                components: [
                    { name: 'HRA', type: 'earning', amount: 40, isPercentage: true, isFixed: true },
                    { name: 'Conveyance', type: 'earning', amount: 2000, isPercentage: false, isFixed: true }
                ]
            }
        ];

        for (const configData of salaryConfigs) {
            await SalaryConfig.create({
                ...configData,
                company: company._id,
                standardDeductions: {
                    pf: { enabled: true, percentage: 12 },
                    esi: { enabled: false, percentage: 0.75 },
                    professionalTax: { enabled: true, amount: 200 },
                    tds: { enabled: false, percentage: 0 }
                }
            });
        }
        console.log('✅ Salary configurations created for all users');

        console.log('\n🎉 Seed completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Company: Varient Worldwide');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Users:');
        console.log('  • Rajvi (Admin): rajvi@varientworld.com / Rajvi@123');
        console.log('  • Shubh (Supervisor): shubh@varientworld.com / Shubh@123');
        console.log('  • Tushar (Employee): developers1@varientworld.com / Tushar@123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Seed error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    seedData();
}

module.exports = seedData;
