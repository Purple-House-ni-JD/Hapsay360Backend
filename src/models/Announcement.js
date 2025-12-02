import mongoose from 'mongoose';
import { generateId } from '../lib/idGenerator.js';

const attachmentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
}, { _id: false });

const announcementSchema = new mongoose.Schema({
    custom_id: {
        type: String,
        unique: true,
        default: () => generateId('ANN')
    },
    station_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PoliceStation',
        required: false,
        default: null
    },
    title: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    attachments: {
        type: [attachmentSchema],
        required: false,
        default: null
    },
    date: {
        type: Date,
        required: false,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
        required: false,
        default: 'DRAFT'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at before saving
announcementSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;

