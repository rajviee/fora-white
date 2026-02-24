const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    content: {
        type: String,
        default: null
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text'
    },
    // File attachments
    attachments: [{
        filename: { type: String },
        originalName: { type: String },
        path: { type: String },
        size: { type: Number },
        mimeType: { type: String },
        fileExtension: { type: String },
        thumbnailPath: { type: String, default: null }
    }],
    // Reply to another message
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        default: null
    },
    // Mentions
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Read receipts
    readBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date }
    }],
    // Message status
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, createdAt: -1 });
chatMessageSchema.index({ company: 1, room: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
