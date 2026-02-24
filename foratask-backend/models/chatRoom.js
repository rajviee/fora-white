const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    type: {
        type: String,
        enum: ['dm', 'group'],
        required: true
    },
    name: {
        type: String,
        default: null // Only for group chats
    },
    description: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // For DMs, store participant IDs sorted for easy lookup
    dmParticipantKey: {
        type: String,
        default: null,
        index: true
    }
}, {
    timestamps: true
});

// Index for faster queries
chatRoomSchema.index({ company: 1, participants: 1 });
chatRoomSchema.index({ company: 1, lastMessageAt: -1 });

// Static method to find or create DM room
chatRoomSchema.statics.findOrCreateDM = async function(companyId, userId1, userId2) {
    const sortedIds = [userId1.toString(), userId2.toString()].sort();
    const dmKey = sortedIds.join('_');
    
    let room = await this.findOne({
        company: companyId,
        type: 'dm',
        dmParticipantKey: dmKey
    });
    
    if (!room) {
        room = await this.create({
            company: companyId,
            type: 'dm',
            participants: sortedIds,
            createdBy: userId1,
            admins: sortedIds,
            dmParticipantKey: dmKey
        });
    }
    
    return room;
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
