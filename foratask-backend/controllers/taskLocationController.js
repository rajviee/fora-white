const TaskLocation = require('../models/taskLocation');
const TaskTimeline = require('../models/taskTimeline');
const Task = require('../models/task');
const Attendance = require('../models/attendance');
const User = require('../models/user');
const path = require('path');
const mongoose = require('mongoose');

// Create multi-location task locations
const createTaskLocations = async (taskId, companyId, locations, createdBy) => {
    const createdLocations = [];
    
    for (let i = 0; i < locations.length && i < 7; i++) {
        const loc = locations[i];
        const location = await TaskLocation.create({
            task: taskId,
            name: loc.name,
            description: loc.description || '',
            address: loc.address || '',
            coordinates: loc.coordinates || {},
            sequence: i
        });
        createdLocations.push(location);

        // Add timeline entry
        await TaskTimeline.addEntry(taskId, companyId, 'task_created', createdBy, {
            locationId: location._id,
            locationName: loc.name,
            remarks: `Location "${loc.name}" added to task`
        });
    }

    return createdLocations;
};

// Get task locations
const getTaskLocations = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Task ID' });
        }

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const locations = await TaskLocation.find({ task: taskId })
            .populate('progressUpdates.updatedBy', 'firstName lastName avatar')
            .populate('approvedBy', 'firstName lastName')
            .sort({ sequence: 1 });

        res.status(200).json({ success: true, locations });
    } catch (error) {
        console.error('Get task locations error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update location progress
const updateLocationProgress = async (req, res) => {
    try {
        console.log('UpdateLocationProgress started', { params: req.params, body: req.body, fileCount: req.files?.length });
        const { taskId, locationId } = req.params;
        const { status, remarks, geotag } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        // Robust ID validation
        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(locationId)) {
            console.log('Invalid IDs provided');
            return res.status(400).json({ message: 'Invalid Task or Location ID' });
        }

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            console.log('Task not found or company mismatch');
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is assignee
        if (!task.assignees.map(a => a.toString()).includes(userId)) {
            console.log('User not authorized as assignee');
            return res.status(403).json({ message: 'Only assignees can update location progress' });
        }

        const location = await TaskLocation.findOne({ _id: locationId, task: taskId });
        if (!location) {
            console.log('Location not found for this task');
            return res.status(404).json({ message: 'Location not found' });
        }

        // Requirement: Geotagged picture is required for every update
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'A geotagged picture is required for every update' });
        }

        // Parse geotag if string
        let parsedGeotag = geotag;
        if (typeof geotag === 'string') {
            try { 
                parsedGeotag = JSON.parse(geotag); 
            } catch (e) {
                return res.status(400).json({ message: 'Invalid geotag format' });
            }
        }

        if (!parsedGeotag || parsedGeotag.latitude === undefined || parsedGeotag.longitude === undefined) {
            return res.status(400).json({ message: 'Geotag (latitude and longitude) is required' });
        }

        // Handle file attachments
        const attachments = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path.replace(/\\/g, '/'),
            size: file.size,
            mimeType: file.mimetype
        }));

        // Add progress update
        const progressUpdate = {
            status,
            remarks: remarks || '',
            geotag: {
                coordinates: {
                    latitude: Number(parsedGeotag.latitude),
                    longitude: Number(parsedGeotag.longitude)
                },
                accuracy: parsedGeotag.accuracy ? Number(parsedGeotag.accuracy) : null,
                address: parsedGeotag.address || null
            },
            updatedBy: userId,
            timestamp: new Date(),
            attachments
        };

        location.progressUpdates.push(progressUpdate);

        // Update location status
        if (status) {
            const previousStatus = location.status;
            location.status = status;

            if (status === 'In Progress' && !location.startedAt) {
                location.startedAt = new Date();
            } else if (status === 'Completed') {
                location.completedAt = new Date();
            }

            // Add timeline entry
            try {
                await TaskTimeline.addEntry(taskId, companyId, 
                    status === 'Completed' ? 'location_completed' : 'location_update', 
                    userId, {
                        locationId: location._id,
                        locationName: location.name,
                        previousStatus,
                        newStatus: status,
                        geotag: progressUpdate.geotag,
                        remarks,
                        fileName: attachments[0]?.originalName
                    }
                );
            } catch (timelineErr) {
                console.error('Timeline entry failed', timelineErr.message);
                // Continue despite timeline failure
            }
        }

        await location.save();

        // Check if all locations are completed
        const allLocations = await TaskLocation.find({ task: taskId });
        const allCompleted = allLocations.length > 0 && allLocations.every(loc => loc.status === 'Completed');

        if (allCompleted && task.status !== 'Completed') {
            // If self-task, mark as completed, otherwise set to For Approval
            task.status = task.isSelfTask ? 'Completed' : 'For Approval';
            await task.save();

            try {
                await TaskTimeline.addEntry(taskId, companyId, 
                    task.isSelfTask ? 'task_completed' : 'approval_requested', 
                    userId, {
                        remarks: 'All locations completed'
                    }
                );
            } catch (timelineErr) {
                console.error('Task completion timeline entry failed', timelineErr.message);
            }
        }

        await location.populate({ path: 'progressUpdates.updatedBy', select: 'firstName lastName avatar' });

        res.status(200).json({ success: true, location, taskCompleted: allCompleted });
    } catch (error) {
        console.error('CRITICAL: Update location progress error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Mark attendance at location
const markAttendanceAtLocation = async (req, res) => {
    try {
        const { taskId, locationId } = req.params;
        const { coordinates, address, accuracy } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(locationId)) {
            return res.status(400).json({ message: 'Invalid Task or Location ID' });
        }

        if (!coordinates?.latitude || !coordinates?.longitude) {
            return res.status(400).json({ message: 'Geolocation is required' });
        }

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in
        let attendance = await Attendance.findOne({ user: userId, date: today });

        if (!attendance) {
            // Create new attendance with task location
            attendance = await Attendance.create({
                user: userId,
                company: companyId,
                date: today,
                checkIn: {
                    time: new Date(),
                    location: {
                        type: 'task',
                        coordinates: {
                            latitude: coordinates.latitude,
                            longitude: coordinates.longitude
                        },
                        address,
                        accuracy,
                        taskId
                    },
                    isWithinGeofence: false
                },
                status: 'present'
            });
        } else if (!attendance.checkIn.time) {
            // Update existing record with check-in
            attendance.checkIn = {
                time: new Date(),
                location: {
                    type: 'task',
                    coordinates: {
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude
                    },
                    address,
                    accuracy,
                    taskId
                },
                isWithinGeofence: false
            };
            attendance.status = 'present';
            await attendance.save();
        }

        // Add timeline entry
        await TaskTimeline.addEntry(taskId, companyId, 'attendance_marked', userId, {
            attendanceId: attendance._id,
            locationId,
            geotag: {
                coordinates,
                accuracy,
                address
            },
            remarks: 'Attendance marked at task location'
        });

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        console.error('Mark attendance at location error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Viewer approve location
const approveLocation = async (req, res) => {
    try {
        const { taskId, locationId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(locationId)) {
            return res.status(400).json({ message: 'Invalid Task or Location ID' });
        }

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is observer or admin
        const isObserver = task.observers.map(o => o.toString()).includes(userId);
        if (!isObserver && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only observers or admin can approve' });
        }

        const location = await TaskLocation.findOne({ _id: locationId, task: taskId });
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        if (location.status !== 'Completed') {
            return res.status(400).json({ message: 'Location must be completed before approval' });
        }

        location.approvedBy = userId;
        location.approvedAt = new Date();
        await location.save();

        // Add timeline entry
        await TaskTimeline.addEntry(taskId, companyId, 'approval_granted', userId, {
            locationId: location._id,
            locationName: location.name,
            remarks: 'Location approved'
        });

        res.status(200).json({ success: true, location });
    } catch (error) {
        console.error('Approve location error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Viewer approve entire task (all locations)
const approveAllLocations = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Task ID' });
        }

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is observer or admin
        const isObserver = task.observers.map(o => o.toString()).includes(userId);
        if (!isObserver && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only observers or admin can approve' });
        }

        // Update all locations
        await TaskLocation.updateMany(
            { task: taskId },
            {
                status: 'Completed',
                approvedBy: userId,
                approvedAt: new Date(),
                completedAt: new Date()
            }
        );

        // Update task status
        task.status = 'Completed';
        await task.save();

        // Add timeline entry
        await TaskTimeline.addEntry(taskId, companyId, 'task_completed', userId, {
            remarks: 'All locations approved and task completed'
        });

        res.status(200).json({
            success: true,
            message: 'All locations approved and task completed'
        });
    } catch (error) {
        console.error('Approve all locations error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add locations via API route
const addLocations = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { locations } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Task ID' });
        }

        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Requirement: Only allowed if task is Pending
        if (task.status !== 'Pending') {
            return res.status(400).json({ message: 'Locations can only be added when task is in Pending state' });
        }

        // Requirement: Assignee and Observer both can add
        const isAssignee = task.assignees.map(a => a.toString()).includes(userId);
        const isObserver = task.observers.map(o => o.toString()).includes(userId);
        const isAdmin = req.user.role === 'admin';

        if (!isAssignee && !isObserver && !isAdmin) {
            return res.status(403).json({ message: 'Only assignees or observers can add locations' });
        }

        if (!locations || !Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ message: 'Locations array is required' });
        }

        const created = await createTaskLocations(taskId, companyId, locations, userId);
        
        // Mark task as multi-location and update references
        const locationIds = created.map(l => l._id);
        await Task.findByIdAndUpdate(taskId, { 
            isMultiLocation: true,
            $push: { locations: { $each: locationIds } }
        });

        res.status(201).json({ success: true, locations: created });
    } catch (error) {
        console.error('Add locations error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Clear all locations from a task
const clearLocations = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Task ID' });
        }

        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Requirement: Only allowed if task is Pending
        if (task.status !== 'Pending') {
            return res.status(400).json({ message: 'Locations can only be cleared when task is in Pending state' });
        }

        // Requirement: Assignee and Observer both can clear
        const isAssignee = task.assignees.map(a => a.toString()).includes(userId);
        const isObserver = task.observers.map(o => o.toString()).includes(userId);
        const isAdmin = req.user.role === 'admin';

        if (!isAssignee && !isObserver && !isAdmin) {
            return res.status(403).json({ message: 'Only assignees or observers can clear locations' });
        }

        await TaskLocation.deleteMany({ task: taskId });
        
        await Task.findByIdAndUpdate(taskId, { 
            isMultiLocation: false,
            locations: [] 
        });

        await TaskTimeline.addEntry(taskId, companyId, 'location_update', userId, {
            remarks: 'All task locations cleared'
        });

        res.status(200).json({ success: true, message: 'All locations cleared successfully' });
    } catch (error) {
        console.error('Clear locations error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTaskLocations,
    getTaskLocations,
    updateLocationProgress,
    markAttendanceAtLocation,
    approveLocation,
    approveAllLocations,
    addLocations,
    clearLocations
};
