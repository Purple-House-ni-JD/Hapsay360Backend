import {Announcement} from '../models/index.js';

export const createAnnouncement = async (req, res) => {
    try {
        const { station_id, title, details, attachments, status } = req.body;

        if (!station_id || !title || !details || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                status: status
            });
        }

        const newAnnouncement = new Announcement({
            station_id,
            title,
            details,
            attachments,
            status
        });

        const savedAnnouncement = await newAnnouncement.save();
        res.status(201).json({
            success: true,
            data: savedAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate('station_id', 'name custom_id');
        res.status(200).json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error('Error getting announcements:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const deletedAnnouncement = await Announcement.findByIdAndDelete(announcementId);
        if (!deletedAnnouncement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const { station_id, title, details, attachments, status } = req.body;

        if (!station_id || !title || !details || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                status: status
            });
        }

        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        announcement.station_id = station_id;
        announcement.title = title;
        announcement.details = details;
        announcement.attachments = attachments;
        announcement.status = status;

        const updatedAnnouncement = await announcement.save();
        res.status(200).json({
            success: true,
            data: updatedAnnouncement
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};