const jwt = require('jsonwebtoken');
const MasterAdmin = require('../models/masterAdmin');

const MASTER_ADMIN_JWT_SECRET = process.env.MASTER_ADMIN_JWT_SECRET || 'master-admin-secret-key';

const masterAdminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token missing' });
        }

        const decoded = jwt.verify(token, MASTER_ADMIN_JWT_SECRET);

        if (decoded.role !== 'master-admin') {
            return res.status(403).json({ message: 'Access denied. Master admin only.' });
        }

        const admin = await MasterAdmin.findById(decoded.id);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: 'Invalid or deactivated admin' });
        }

        req.masterAdmin = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            permissions: admin.permissions
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(500).json({ message: error.message });
    }
};

module.exports = masterAdminAuth;
