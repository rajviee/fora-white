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
        console.log('--- UPDATE LOCATION PROGRESS START ---');
        const { taskId, locationId } = req.params;
        const { status, remarks, geotag } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        console.log(`Task: ${taskId}, Location: ${locationId}, Status: ${status}`);

        // Robust ID validation
        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(locationId)) {
            console.log('Error: Invalid IDs');
            return res.status(400).json({ message: 'Invalid Task or Location ID' });
        }

        // Verify task access
        console.log('Fetching fresh task data...');
        const freshTask = await Task.findOne({ _id: taskId, company: companyId });
        if (!freshTask) {
            console.log('Error: Task not found or company mismatch');
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is assignee
        console.log('Verifying assignee status...');
        if (!freshTask.assignees.map(a => a.toString()).includes(userId)) {
            console.log('Error: Unauthorized assignee');
            return res.status(403).json({ message: 'Only assignees can update location progress' });
        }

        console.log('Fetching location details...');
        const location = await TaskLocation.findOne({ _id: locationId, task: taskId });
        if (!location) {
            console.log('Error: Location not found for this task');
            return res.status(404).json({ message: 'Location not found' });
        }

        // Requirement: Geotagged picture is required for every update
        if (!req.files || req.files.length === 0) {
            console.log('Error: No files uploaded');
            return res.status(400).json({ message: 'A geotagged picture is required for every update' });
        }

        // Parse geotag if string
        console.log('Parsing geotag data...');
        let parsedGeotag = geotag;
        if (typeof geotag === 'string') {
            try { 
                parsedGeotag = JSON.parse(geotag); 
            } catch (e) {
                console.log('Error: Failed to parse geotag string');
                return res.status(400).json({ message: 'Invalid geotag format' });
            }
        }

        if (!parsedGeotag || parsedGeotag.latitude === undefined || parsedGeotag.longitude === undefined) {
            console.log('Error: Geotag coordinates missing');
            return res.status(400).json({ message: 'Geotag (latitude and longitude) is required' });
        }

        // Handle file attachments
        console.log('Processing file attachments...');
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
            console.log(`Updating location status to: ${status}`);
            const previousStatus = location.status;
            location.status = status;

            if (status === 'In Progress' && !location.startedAt) {
                location.startedAt = new Date();
                // Automatically update task status to 'In Progress' if it's currently Pending or Overdue
                if (freshTask.status === 'Pending' || freshTask.status === 'Overdue') {
                    console.log('Transitioning task status to In Progress...');
                    await Task.findByIdAndUpdate(taskId, { status: 'In Progress' });
                }
            } else if (status === 'Completed') {
                location.completedAt = new Date();
            }

            // Add timeline entry
            try {
                console.log('Recording timeline entry...');
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
                console.error('Timeline entry failed:', timelineErr.message);
            }
        }

        console.log('Saving location record...');
        await location.save();

        // Check if all locations are completed
        console.log('Checking all locations for completion...');
        const allLocs = await TaskLocation.find({ task: taskId });
        const allCompleted = allLocs.length > 0 && allLocs.every(l => l.status === 'Completed');

        // Refresh task status if needed
        if (allCompleted) {
            console.log('All locations completed. Verifying final task state...');
            const updatedTask = await Task.findById(taskId);
            if (updatedTask && updatedTask.status !== 'Completed' && updatedTask.status !== 'For Approval') {
                const newStatus = updatedTask.isSelfTask ? 'Completed' : 'For Approval';
                console.log(`Final task status update: ${newStatus}`);
                await Task.findByIdAndUpdate(taskId, { status: newStatus });

                try {
                    await TaskTimeline.addEntry(taskId, companyId, 
                        updatedTask.isSelfTask ? 'task_completed' : 'approval_requested', 
                        userId, {
                            remarks: 'All locations completed'
                        }
                    );
                } catch (timelineErr) {
                    console.error('Task completion timeline entry failed:', timelineErr.message);
                }
            }
        }

        console.log('Finalizing response...');
        await TaskLocation.populate(location, { path: 'progressUpdates.updatedBy', select: 'firstName lastName avatar' });

        console.log('--- UPDATE LOCATION PROGRESS SUCCESS ---');
        res.status(200).json({ success: true, location, taskCompleted: allCompleted });
    } catch (error) {
        console.error('--- CRITICAL: UPDATE LOCATION PROGRESS ERROR ---');
        console.error(error);
        res.status(500).json({ 
            message: 'Server error: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
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

        // Requirement: Only allowed if task is Pending or Overdue
        if (task.status !== 'Pending' && task.status !== 'Overdue') {
            return res.status(400).json({ message: 'Locations can only be added when task is in Pending or Overdue state' });
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

// Delete all task locations (already exists, but listed for context)
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

        // Requirement: Only allowed if task is Pending or Overdue
        if (task.status !== 'Pending' && task.status !== 'Overdue') {
            return res.status(400).json({ message: 'Locations can only be cleared when task is in Pending or Overdue state' });
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

// Update a specific location (name/description)
const updateLocation = async (req, res) => {
    try {
        const { taskId, locationId } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(locationId)) {
            return res.status(400).json({ message: 'Invalid IDs' });
        }

        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const isAssignee = task.assignees.map(a => a.toString()).includes(userId);
        const isObserver = task.observers.map(o => o.toString()).includes(userId);
        if (!isAssignee && !isObserver && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to edit location' });
        }

        const location = await TaskLocation.findOne({ _id: locationId, task: taskId });
        if (!location) return res.status(404).json({ message: 'Location not found' });

        if (location.status === 'Completed') {
            return res.status(400).json({ message: 'Cannot edit a completed location' });
        }

        if (name) location.name = name;
        if (description !== undefined) location.description = description;
        
        await location.save();

        res.status(200).json({ success: true, location });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a specific location
const deleteLocation = async (req, res) => {
    try {
        const { taskId, locationId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(locationId)) {
            return res.status(400).json({ message: 'Invalid IDs' });
        }

        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const location = await TaskLocation.findOne({ _id: locationId, task: taskId });
        if (!location) return res.status(404).json({ message: 'Location not found' });

        if (location.status === 'Completed') {
            return res.status(400).json({ message: 'Cannot delete a completed location' });
        }

        const isAssignee = task.assignees.map(a => a.toString()).includes(userId);
        const isObserver = task.observers.map(o => o.toString()).includes(userId);
        const isAdmin = req.user.role === 'admin';

        let canDelete = false;
        if (isAdmin) canDelete = true;
        else if (isObserver) canDelete = true; // Observer can delete even if In Progress (but not Completed)
        else if (isAssignee && location.status === 'Pending') canDelete = true; // Assignee only if Pending

        if (!canDelete) {
            return res.status(403).json({ message: 'Not authorized to delete this location in its current state' });
        }

        await TaskLocation.deleteOne({ _id: locationId });
        
        // Remove from task locations array
        await Task.findByIdAndUpdate(taskId, {
            $pull: { locations: locationId }
        });

        res.status(200).json({ success: true, message: 'Location deleted' });
    } catch (error) {
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
    clearLocations,
    updateLocation,
    deleteLocation
};
