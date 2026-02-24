const TaskDiscussion = require('../models/taskDiscussion');
const TaskTimeline = require('../models/taskTimeline');
const Task = require('../models/task');
const User = require('../models/user');
const Notification = require('../models/notification');
const path = require('path');

// Get discussions for a task
const getDiscussions = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has access (assignee, observer, creator, or admin)
        const hasAccess = req.user.role === 'admin' ||
            task.createdBy?.toString() === userId ||
            task.assignees.map(a => a.toString()).includes(userId) ||
            task.observers.map(o => o.toString()).includes(userId);

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const discussions = await TaskDiscussion.find({
            task: taskId,
            isDeleted: false,
            parentComment: null
        })
        .populate('author', 'firstName lastName avatar email')
        .populate('mentions', 'firstName lastName')
        .populate({
            path: 'parentComment',
            populate: { path: 'author', select: 'firstName lastName' }
        })
        .sort({ createdAt: 1 });

        // Get replies for each discussion
        const discussionsWithReplies = await Promise.all(discussions.map(async (disc) => {
            const replies = await TaskDiscussion.find({
                task: taskId,
                parentComment: disc._id,
                isDeleted: false
            })
            .populate('author', 'firstName lastName avatar email')
            .populate('mentions', 'firstName lastName')
            .sort({ createdAt: 1 });

            return {
                ...disc.toObject(),
                replies
            };
        }));

        res.status(200).json({
            success: true,
            discussions: discussionsWithReplies
        });
    } catch (error) {
        console.error('Get discussions error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add comment to task
const addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content, mentions = [], parentCommentId = null } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has access
        const hasAccess = req.user.role === 'admin' ||
            task.createdBy?.toString() === userId ||
            task.assignees.map(a => a.toString()).includes(userId) ||
            task.observers.map(o => o.toString()).includes(userId);

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Handle file attachments
        const attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachments.push({
                    filename: file.filename,
                    originalName: file.originalname,
                    path: file.path.replace(/\\/g, '/'),
                    size: file.size,
                    mimeType: file.mimetype,
                    fileExtension: path.extname(file.originalname)
                });
            });
        }

        const comment = await TaskDiscussion.create({
            task: taskId,
            company: companyId,
            author: userId,
            content: content.trim(),
            mentions,
            attachments,
            parentComment: parentCommentId
        });

        await comment.populate('author', 'firstName lastName avatar email');
        await comment.populate('mentions', 'firstName lastName');

        // Add timeline entry
        await TaskTimeline.addEntry(taskId, companyId, 'comment_added', userId, {
            commentId: comment._id,
            remarks: content.substring(0, 100)
        });

        // Notify mentioned users and task participants
        const author = await User.findById(userId);
        const notifyUsers = new Set();

        // Add mentioned users
        mentions.forEach(m => notifyUsers.add(m.toString()));

        // Add task participants (excluding the commenter)
        [...task.assignees, ...task.observers, task.createdBy].forEach(id => {
            if (id && id.toString() !== userId) {
                notifyUsers.add(id.toString());
            }
        });

        const notifications = [...notifyUsers].map(notifyUserId => ({
            userId: notifyUserId,
            senderId: userId,
            taskId,
            type: mentions.includes(notifyUserId) ? 'mention' : 'comment',
            message: `${author.firstName} ${author.lastName} ${mentions.includes(notifyUserId) ? 'mentioned you' : 'commented'} on task "${task.title}"`,
            company: companyId
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Emit socket event
        if (global.io) {
            [...task.assignees, ...task.observers].forEach(participantId => {
                if (participantId.toString() !== userId) {
                    const socketId = global.connectedUsers[participantId.toString()];
                    if (socketId) {
                        global.io.to(socketId).emit('newTaskComment', {
                            taskId,
                            comment
                        });
                    }
                }
            });
        }

        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Edit comment
const editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        const comment = await TaskDiscussion.findOne({
            _id: commentId,
            company: companyId,
            isDeleted: false
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only author can edit
        if (comment.author.toString() !== userId) {
            return res.status(403).json({ message: 'Only comment author can edit' });
        }

        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = new Date();

        await comment.save();
        await comment.populate('author', 'firstName lastName avatar email');

        res.status(200).json({ success: true, comment });
    } catch (error) {
        console.error('Edit comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete comment
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;

        const comment = await TaskDiscussion.findOne({
            _id: commentId,
            company: companyId,
            isDeleted: false
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only author or admin can delete
        if (comment.author.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }

        comment.isDeleted = true;
        comment.deletedAt = new Date();
        await comment.save();

        // Also delete replies
        await TaskDiscussion.updateMany(
            { parentComment: commentId },
            { isDeleted: true, deletedAt: new Date() }
        );

        res.status(200).json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get task timeline
const getTaskTimeline = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company;
        const { limit = 50, page = 0 } = req.query;

        // Verify task access
        const task = await Task.findOne({ _id: taskId, company: companyId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has access
        const hasAccess = req.user.role === 'admin' ||
            task.createdBy?.toString() === userId ||
            task.assignees.map(a => a.toString()).includes(userId) ||
            task.observers.map(o => o.toString()).includes(userId);

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const timeline = await TaskTimeline.find({ task: taskId })
            .populate('performedBy', 'firstName lastName avatar email')
            .populate('details.addedUsers', 'firstName lastName')
            .populate('details.removedUsers', 'firstName lastName')
            .sort({ timestamp: -1 })
            .skip(parseInt(page) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await TaskTimeline.countDocuments({ task: taskId });

        res.status(200).json({
            success: true,
            timeline: timeline.reverse(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get task timeline error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDiscussions,
    addComment,
    editComment,
    deleteComment,
    getTaskTimeline
};
