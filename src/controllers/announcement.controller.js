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

        // Handle attachments - convert base64 to Buffer
        let attachmentArray = [];
        if (attachments && Array.isArray(attachments)) {
            attachmentArray = attachments.map(att => {
                // If it's base64 data, convert to Buffer
                if (att.data && typeof att.data === 'string' && att.data.startsWith('data:')) {
                    // Extract base64 data from data URL (data:image/png;base64,...)
                    const base64Data = att.data.split(',')[1] || att.data;
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    return {
                        filename: att.filename || att.name || 'attachment',
                        mimetype: att.mimetype || att.type || 'application/octet-stream',
                        data: buffer,
                        size: buffer.length
                    };
                }
                // If it's already a buffer or existing attachment, keep as is
                return att;
            });
        } else if (attachments && attachments.data) {
            // Single attachment
            const base64Data = attachments.data.split(',')[1] || attachments.data;
            const buffer = Buffer.from(base64Data, 'base64');
            attachmentArray = [{
                filename: attachments.filename || attachments.name || 'attachment',
                mimetype: attachments.mimetype || attachments.type || 'application/octet-stream',
                data: buffer,
                size: buffer.length
            }];
        }

        const newAnnouncement = new Announcement({
            station_id,
            title,
            details,
            attachments: attachmentArray,
            status
        });

        const savedAnnouncement = await newAnnouncement.save();
        
        // Convert binary data to URLs in response
        const responseData = savedAnnouncement.toObject();
        if (responseData.attachments) {
            responseData.attachments = responseData.attachments.map((att, index) => ({
                filename: att.filename,
                mimetype: att.mimetype,
                size: att.size,
                url: `/api/announcements/${savedAnnouncement._id}/attachments/${index}`
            }));
        }
        
        res.status(201).json({
            success: true,
            data: responseData
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
        
        // Convert binary data to URLs in response
        const announcementsWithUrls = announcements.map(announcement => {
            const announcementObj = announcement.toObject();
            if (announcementObj.attachments && announcementObj.attachments.length > 0) {
                announcementObj.attachments = announcementObj.attachments.map((att, index) => ({
                    filename: att.filename,
                    mimetype: att.mimetype,
                    size: att.size,
                    url: `/api/announcements/${announcement._id}/attachments/${index}`
                }));
            }
            return announcementObj;
        });
        
        res.status(200).json({
            success: true,
            data: announcementsWithUrls
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

        // Handle attachments - convert base64 to Buffer for new attachments, keep existing ones
        let attachmentArray = [];
        if (attachments && Array.isArray(attachments)) {
            attachmentArray = attachments.map(att => {
                // If it has a URL (existing attachment), extract index and keep existing data from DB
                if (att.url && !att.data) {
                    // Extract index from URL like /api/announcements/:id/attachments/:index
                    // or just the index if it's a number in the URL path
                    const urlMatch = att.url.match(/\/attachments\/(\d+)/);
                    if (urlMatch) {
                        const index = parseInt(urlMatch[1]);
                        // Keep the existing attachment from the database
                        if (announcement.attachments && announcement.attachments[index]) {
                            return announcement.attachments[index];
                        }
                    }
                }
                // If it's base64 data, convert to Buffer
                if (att.data && typeof att.data === 'string' && att.data.startsWith('data:')) {
                    const base64Data = att.data.split(',')[1] || att.data;
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    return {
                        filename: att.filename || att.name || 'attachment',
                        mimetype: att.mimetype || att.type || 'application/octet-stream',
                        data: buffer,
                        size: buffer.length
                    };
                }
                // If it already has a buffer (shouldn't happen from frontend, but handle it)
                if (att.data && Buffer.isBuffer(att.data)) {
                    return att;
                }
                return att;
            });
        }

        announcement.station_id = station_id;
        announcement.title = title;
        announcement.details = details;
        announcement.attachments = attachmentArray;
        announcement.status = status;

        const updatedAnnouncement = await announcement.save();
        
        // Convert binary data to URLs in response
        const responseData = updatedAnnouncement.toObject();
        if (responseData.attachments) {
            responseData.attachments = responseData.attachments.map((att, index) => ({
                filename: att.filename,
                mimetype: att.mimetype,
                size: att.size,
                url: `/api/announcements/${updatedAnnouncement._id}/attachments/${index}`
            }));
        }
        
        res.status(200).json({
            success: true,
            data: responseData
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

// New endpoint to serve attachment images
export const getAttachment = async (req, res) => {
    try {
        const { announcementId, attachmentIndex } = req.params;
        const index = parseInt(attachmentIndex);

        console.log(`Fetching attachment: announcementId=${announcementId}, index=${index}`);

        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            console.log(`Announcement not found: ${announcementId}`);
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        if (!announcement.attachments || announcement.attachments.length === 0) {
            console.log(`No attachments found for announcement: ${announcementId}`);
            return res.status(404).json({
                success: false,
                message: 'No attachments found'
            });
        }

        if (!announcement.attachments[index]) {
            console.log(`Attachment index ${index} not found. Total attachments: ${announcement.attachments.length}`);
            return res.status(404).json({
                success: false,
                message: `Attachment not found at index ${index}`
            });
        }

        const attachment = announcement.attachments[index];
        
        if (!attachment.data || !Buffer.isBuffer(attachment.data)) {
            console.log(`Attachment data is invalid for index ${index}`);
            return res.status(500).json({
                success: false,
                message: 'Invalid attachment data'
            });
        }

        console.log(`Serving attachment: ${attachment.filename}, type: ${attachment.mimetype}, size: ${attachment.data.length}`);
        
        // Encode filename properly to handle special characters (RFC 5987)
        const encodedFilename = encodeURIComponent(attachment.filename);
        
        // Set appropriate headers
        res.set('Content-Type', attachment.mimetype || 'image/jpeg');
        res.set('Content-Length', attachment.data.length);
        res.set('Content-Disposition', `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
        // Add CORS headers for image requests
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        
        // Send the binary data
        res.send(attachment.data);
    } catch (error) {
        console.error('Error getting attachment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};  