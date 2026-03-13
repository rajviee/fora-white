const Attendance = require('../models/attendance');
const OrganizationSettings = require('../models/organizationSettings');
const User = require('../models/user');
const Task = require('../models/task');
const TaskTimeline = require('../models/taskTimeline');

// Check-in (Start of Day)
const checkIn = async (req, res) => {
    try {
        const { coordinates, address, accuracy, taskId = null } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
            return res.status(400).json({ message: 'Geolocation is required' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        let attendance = await Attendance.findOne({ user: userId, date: today });
        if (attendance && attendance.checkIn.time) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        // Get organization settings
        const orgSettings = await OrganizationSettings.findOne({ company: companyId });
        
        // Determine location type and geofence status
        let locationType = 'remote';
        let isWithinGeofence = false;
        let officeName = null;

        if (orgSettings && orgSettings.officeLocations && orgSettings.officeLocations.length > 0) {
            const geofenceCheck = orgSettings.isWithinOfficeGeofence(
                coordinates.latitude, 
                coordinates.longitude
            );
            
            if (geofenceCheck.isWithin) {
                locationType = 'office';
                isWithinGeofence = true;
                officeName = geofenceCheck.office.name;
            } else {
                // If office locations are set, user MUST be in one of them to check in
                return res.status(403).json({ 
                    message: `You must be within ${geofenceCheck.office?.geofenceRadius || 100}m of an office location to check in.` 
                });
            }
        } else if (taskId) {
            locationType = 'task';
        }

        // Check if late
        let isLate = false;
        let lateByMinutes = 0;
        const now = new Date();
        
        if (orgSettings) {
            const [startHour, startMin] = orgSettings.workingHours.startTime.split(':').map(Number);
            const expectedStart = new Date(now);
            expectedStart.setHours(startHour, startMin + (orgSettings.attendance.lateToleranceMinutes || 0), 0, 0);
            
            if (now > expectedStart) {
                isLate = true;
                lateByMinutes = Math.floor((now - expectedStart) / (1000 * 60));
            }
        }

        if (!attendance) {
            attendance = new Attendance({
                user: userId,
                company: companyId,
                date: today
            });
        }

        attendance.checkIn = {
            time: now,
            location: {
                type: locationType,
                coordinates: {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude
                },
                address: address || null,
                accuracy: accuracy || null,
                officeName,
                taskId
            },
            isWithinGeofence,
            isLate,
            lateByMinutes
        };
        attendance.status = 'present';

        await attendance.save();

        // Add timeline entry if checking in at task
        if (taskId) {
            await TaskTimeline.addEntry(taskId, companyId, 'attendance_marked', userId, {
                attendanceId: attendance._id,
                geotag: {
                    coordinates,
                    accuracy,
                    address
                },
                remarks: 'Checked in at task location'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Checked in successfully',
            attendance: {
                id: attendance._id,
                checkInTime: attendance.checkIn.time,
                locationType,
                isWithinGeofence,
                isLate,
                lateByMinutes
            }
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Check-out (End of Day)
const checkOut = async (req, res) => {
    try {
        const { coordinates, address, accuracy, taskId = null } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
            return res.status(400).json({ message: 'Geolocation is required' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ user: userId, date: today });
        if (!attendance || !attendance.checkIn.time) {
            return res.status(400).json({ message: 'Not checked in today' });
        }
        if (attendance.checkOut.time) {
            return res.status(400).json({ message: 'Already checked out today' });
        }

        // Get organization settings
        const orgSettings = await OrganizationSettings.findOne({ company: companyId });

        // Determine location type
        let locationType = 'remote';
        let isWithinGeofence = false;
        let officeName = null;

        if (orgSettings) {
            const geofenceCheck = orgSettings.isWithinOfficeGeofence(
                coordinates.latitude, 
                coordinates.longitude
            );
            
            if (geofenceCheck.isWithin) {
                locationType = 'office';
                isWithinGeofence = true;
                officeName = geofenceCheck.office.name;
            } else if (taskId) {
                locationType = 'task';
            }
        }

        // Check if early leave
        let isEarlyLeave = false;
        let earlyByMinutes = 0;
        const now = new Date();

        if (orgSettings) {
            const [endHour, endMin] = orgSettings.workingHours.endTime.split(':').map(Number);
            const expectedEnd = new Date(now);
            expectedEnd.setHours(endHour, endMin - (orgSettings.attendance.earlyLeaveToleranceMinutes || 0), 0, 0);
            
            if (now < expectedEnd) {
                isEarlyLeave = true;
                earlyByMinutes = Math.floor((expectedEnd - now) / (1000 * 60));
            }
        }

        attendance.checkOut = {
            time: now,
            location: {
                type: locationType,
                coordinates: {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude
                },
                address: address || null,
                accuracy: accuracy || null,
                officeName,
                taskId
            },
            isWithinGeofence,
            isEarlyLeave,
            earlyByMinutes
        };

        // Calculate working hours
        const expectedMinutes = orgSettings ? orgSettings.workingHours.totalHours * 60 : 480;
        attendance.calculateWorkingHours(expectedMinutes);

        // Update status if half day
        if (attendance.workingHours.total < expectedMinutes / 2) {
            attendance.status = 'half-day';
        }

        await attendance.save();

        res.status(200).json({
            success: true,
            message: 'Checked out successfully',
            attendance: {
                id: attendance._id,
                checkOutTime: attendance.checkOut.time,
                locationType,
                isWithinGeofence,
                isEarlyLeave,
                earlyByMinutes,
                workingHours: attendance.workingHours
            }
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get today's attendance status
const getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ user: userId, date: today });

        res.status(200).json({
            success: true,
            attendance: attendance || null,
            hasCheckedIn: !!attendance?.checkIn?.time,
            hasCheckedOut: !!attendance?.checkOut?.time
        });
    } catch (error) {
        console.error('Get today status error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get attendance history for a user
const getAttendanceHistory = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const companyId = req.user.company;
        const { month, year } = req.query;

        // Verify access (admin or self)
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const queryYear = parseInt(year) || new Date().getFullYear();
        const queryMonth = parseInt(month) || new Date().getMonth();

        const startDate = new Date(queryYear, queryMonth, 1);
        const endDate = new Date(queryYear, queryMonth + 1, 0);

        const records = await Attendance.find({
            user: userId,
            company: companyId,
            date: { $gte: startDate, $lte: endDate }
        })
        .populate('leaveRequest')
        .sort({ date: 1 });

        // Get monthly stats
        const stats = await Attendance.getMonthlyStats(userId, queryYear, queryMonth);

        // Get organization settings for working days
        const orgSettings = await OrganizationSettings.findOne({ company: companyId });
        const expectedWorkingDays = orgSettings ? 
            orgSettings.getWorkingDaysInMonth(queryYear, queryMonth) : 22;

        res.status(200).json({
            success: true,
            records,
            stats: {
                ...stats,
                expectedWorkingDays,
                attendancePercentage: ((stats.present + stats.halfDay * 0.5) / expectedWorkingDays * 100).toFixed(1)
            },
            period: { month: queryMonth, year: queryYear }
        });
    } catch (error) {
        console.error('Get attendance history error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get all employees attendance for a day
const getDailyAttendance = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { date } = req.query;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        // Get all employees
        const employees = await User.find({ 
            company: companyId, 
            role: { $ne: 'admin' } 
        }).select('firstName lastName email avatar');

        // Get attendance records for the date
        const attendanceRecords = await Attendance.find({
            company: companyId,
            date: queryDate
        }).populate('user', 'firstName lastName email avatar');

        // Map attendance to employees
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.user._id.toString()] = record;
        });

        const result = employees.map(emp => ({
            employee: emp,
            attendance: attendanceMap[emp._id.toString()] || null
        }));

        const summary = {
            total: employees.length,
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: employees.length - attendanceRecords.length,
            halfDay: attendanceRecords.filter(r => r.status === 'half-day').length,
            onLeave: attendanceRecords.filter(r => r.status === 'on-leave').length,
            late: attendanceRecords.filter(r => r.checkIn?.isLate).length
        };

        res.status(200).json({
            success: true,
            date: queryDate,
            employees: result,
            summary
        });
    } catch (error) {
        console.error('Get daily attendance error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Admin: Get employee analytics
const getEmployeeAnalytics = async (req, res) => {
    try {
        const { userId } = req.params;
        const companyId = req.user.company;
        const { months = 6 } = req.query;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const employee = await User.findOne({ _id: userId, company: companyId })
            .select('firstName lastName email avatar designation role');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Get attendance trends
        const now = new Date();
        const trends = [];

        for (let i = parseInt(months) - 1; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const stats = await Attendance.getMonthlyStats(
                userId, 
                monthDate.getFullYear(), 
                monthDate.getMonth()
            );

            trends.push({
                month: monthDate.toLocaleString('default', { month: 'short' }),
                year: monthDate.getFullYear(),
                ...stats
            });
        }

        // Get task stats
        const taskStats = await Task.aggregate([
            { $match: { assignees: employee._id, company: employee.company } },
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
            inProgress: 0,
            overdue: 0
        };

        taskStats.forEach(stat => {
            tasks.total += stat.count;
            switch(stat._id) {
                case 'Completed': tasks.completed = stat.count; break;
                case 'Pending': tasks.pending = stat.count; break;
                case 'In Progress': tasks.inProgress = stat.count; break;
                case 'Overdue': tasks.overdue = stat.count; break;
            }
        });

        res.status(200).json({
            success: true,
            employee,
            attendanceTrends: trends,
            taskStats: tasks
        });
    } catch (error) {
        console.error('Get employee analytics error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getTodayStatus,
    getAttendanceHistory,
    getDailyAttendance,
    getEmployeeAnalytics
};
