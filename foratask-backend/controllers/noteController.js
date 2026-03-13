const Note = require('../models/note');

const getNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.company;
        const notes = await Note.find({ user: userId, company: companyId })
            .populate('user', 'firstName lastName avatar')
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createNote = async (req, res) => {
    try {
        const { title, content, color } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const note = new Note({
            user: userId,
            company: companyId,
            title,
            content,
            color: color || '#ffffff'
        });

        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, color } = req.body;
        const userId = req.user.id;

        const note = await Note.findOne({ _id: id, user: userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (color) note.color = color;

        await note.save();
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const note = await Note.findOneAndDelete({ _id: id, user: userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote
};
