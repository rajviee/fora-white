const express = require('express');
const router = express.Router();
const {
    getDiscussions,
    addComment,
    editComment,
    deleteComment,
    getTaskTimeline
} = require('../controllers/taskDiscussionController');
const {
    getTaskLocations,
    updateLocationProgress,
    markAttendanceAtLocation,
    approveLocation,
    approveAllLocations,
    addLocations,
    clearLocations
} = require('../controllers/taskLocationController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

// Task discussions
router.get('/:taskId/discussions', getDiscussions);
router.post('/:taskId/discussions', upload.array('file', 5), addComment);
router.patch('/:taskId/discussions/:commentId', editComment);
router.delete('/:taskId/discussions/:commentId', deleteComment);

// Task timeline
router.get('/:taskId/timeline', getTaskTimeline);

// Task locations
router.post('/:taskId/locations', addLocations);
router.delete('/:taskId/locations', clearLocations);
router.get('/:taskId/locations', getTaskLocations);
router.patch('/:taskId/locations/:locationId/progress', upload.array('file', 3), updateLocationProgress);
router.post('/:taskId/locations/:locationId/attendance', markAttendanceAtLocation);
router.post('/:taskId/locations/:locationId/approve', approveLocation);
router.post('/:taskId/approve-all', approveAllLocations);

module.exports = router;
