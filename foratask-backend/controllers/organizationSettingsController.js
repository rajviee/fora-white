const OrganizationSettings = require('../models/organizationSettings');

// Get organization settings
const getSettings = async (req, res) => {
    try {
        const companyId = req.user.company;

        let settings = await OrganizationSettings.findOne({ company: companyId });

        if (!settings) {
            // Create default settings
            settings = await OrganizationSettings.create({
                company: companyId
            });
        }

        res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update organization settings (Admin only)
const updateSettings = async (req, res) => {
    try {
        const companyId = req.user.company;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const updates = req.body;

        let settings = await OrganizationSettings.findOne({ company: companyId });

        if (!settings) {
            settings = new OrganizationSettings({ company: companyId });
        }

        // Update fields
        const allowedFields = [
            'workingDays',
            'workingHours',
            'overtime',
            'tasksRemoteByDefault',
            'attendance',
            'leave'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (typeof updates[field] === 'object' && !Array.isArray(updates[field])) {
                    settings[field] = { ...settings[field].toObject(), ...updates[field] };
                } else {
                    settings[field] = updates[field];
                }
            }
        });

        await settings.save();

        res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add office location
const addOfficeLocation = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { name, address, coordinates, geofenceRadius = 300, isPrimary = false } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (!name || !coordinates?.latitude || !coordinates?.longitude) {
            return res.status(400).json({ message: 'Name and coordinates are required' });
        }

        let settings = await OrganizationSettings.findOne({ company: companyId });
        if (!settings) {
            settings = new OrganizationSettings({ company: companyId });
        }

        // If setting as primary, unset other primaries
        if (isPrimary) {
            settings.officeLocations.forEach(loc => {
                loc.isPrimary = false;
            });
        }

        settings.officeLocations.push({
            name,
            address,
            coordinates,
            geofenceRadius,
            isPrimary
        });

        await settings.save();

        res.status(201).json({ 
            success: true, 
            officeLocations: settings.officeLocations 
        });
    } catch (error) {
        console.error('Add office location error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update office location
const updateOfficeLocation = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { locationId } = req.params;
        const updates = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const settings = await OrganizationSettings.findOne({ company: companyId });
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        const location = settings.officeLocations.id(locationId);
        if (!location) {
            return res.status(404).json({ message: 'Office location not found' });
        }

        // Update location fields
        ['name', 'address', 'coordinates', 'geofenceRadius', 'isPrimary'].forEach(field => {
            if (updates[field] !== undefined) {
                location[field] = updates[field];
            }
        });

        // If setting as primary, unset others
        if (updates.isPrimary) {
            settings.officeLocations.forEach(loc => {
                if (loc._id.toString() !== locationId) {
                    loc.isPrimary = false;
                }
            });
        }

        await settings.save();

        res.status(200).json({ 
            success: true, 
            officeLocations: settings.officeLocations 
        });
    } catch (error) {
        console.error('Update office location error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete office location
const deleteOfficeLocation = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { locationId } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const settings = await OrganizationSettings.findOne({ company: companyId });
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        settings.officeLocations = settings.officeLocations.filter(
            loc => loc._id.toString() !== locationId
        );

        await settings.save();

        res.status(200).json({ 
            success: true, 
            officeLocations: settings.officeLocations 
        });
    } catch (error) {
        console.error('Delete office location error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add holiday
const addHoliday = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { name, date, isRecurringYearly = false } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (!name || !date) {
            return res.status(400).json({ message: 'Name and date are required' });
        }

        let settings = await OrganizationSettings.findOne({ company: companyId });
        if (!settings) {
            settings = new OrganizationSettings({ company: companyId });
        }

        settings.holidays.push({
            name,
            date: new Date(date),
            isRecurringYearly
        });

        // Sort holidays by date
        settings.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        await settings.save();

        res.status(201).json({ 
            success: true, 
            holidays: settings.holidays 
        });
    } catch (error) {
        console.error('Add holiday error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete holiday
const deleteHoliday = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { holidayId } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const settings = await OrganizationSettings.findOne({ company: companyId });
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        settings.holidays = settings.holidays.filter(
            h => h._id.toString() !== holidayId
        );

        await settings.save();

        res.status(200).json({ 
            success: true, 
            holidays: settings.holidays 
        });
    } catch (error) {
        console.error('Delete holiday error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get upcoming holidays
const getUpcomingHolidays = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { limit = 10 } = req.query;

        const settings = await OrganizationSettings.findOne({ company: companyId });
        if (!settings) {
            return res.status(200).json({ success: true, holidays: [] });
        }

        const now = new Date();
        const currentYear = now.getFullYear();

        const upcomingHolidays = settings.holidays
            .map(h => {
                const holidayDate = new Date(h.date);
                if (h.isRecurringYearly) {
                    holidayDate.setFullYear(currentYear);
                    if (holidayDate < now) {
                        holidayDate.setFullYear(currentYear + 1);
                    }
                }
                return { ...h.toObject(), effectiveDate: holidayDate };
            })
            .filter(h => h.effectiveDate >= now)
            .sort((a, b) => a.effectiveDate - b.effectiveDate)
            .slice(0, parseInt(limit));

        res.status(200).json({ success: true, holidays: upcomingHolidays });
    } catch (error) {
        console.error('Get upcoming holidays error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    addOfficeLocation,
    updateOfficeLocation,
    deleteOfficeLocation,
    addHoliday,
    deleteHoliday,
    getUpcomingHolidays
};
