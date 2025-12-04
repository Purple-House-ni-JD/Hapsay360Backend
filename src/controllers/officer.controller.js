import { Officer, PoliceStation } from "../models/index.js";
import { validateEmail } from "./auth.controller.js";
import 'pdfkit-table';

export const createOfficer = async (req, res) => {
    try {
        const { first_name, last_name, email, role, station_id, mobile_number, status } = req.body;        


        if (!first_name || !last_name || !email || !role || !station_id || !mobile_number) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if email already exists
        const existingOfficer = await Officer.findOne({ email });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const newOfficer = new Officer({
            first_name,
            last_name,
            email,
            role,
            station_id,
            contact: {
                mobile_number: mobile_number
            },
            status,
        });

        const station = await PoliceStation.findByIdAndUpdate(
            station_id,
            { $push: { officer_IDs: newOfficer._id } },
            { new: true }
        )

        if (!station) {
            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }

        const savedOfficer = await newOfficer.save();
        res.status(201).json({
            success: true,
            message: 'Officer created successfully',
            officer: savedOfficer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

export const getAllOfficers = async (req, res) => {
    try {
        const officers = await Officer.find().populate('station_id', 'name');
        res.status(200).json({
            success: true,
            data: officers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

export const updateOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, role, station_id, mobile_number, status } = req.body;

        if (!first_name || !last_name || !email || !role || !station_id || !mobile_number || !status) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const officer = await Officer.findById(id);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        officer.first_name = first_name;
        officer.last_name = last_name;
        officer.email = email;
        officer.role = role;
        officer.station_id = station_id;
        officer.contact.mobile_number = mobile_number;
        officer.status = status;

        const savedOfficer = await officer.save();
        res.status(200).json({
            success: true,
            message: 'Officer updated successfully',
            officer: savedOfficer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

export const deleteOfficer = async (req, res) => {
    try {
        const { id } = req.params; 
        const officer = await Officer.findByIdAndDelete(id);

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Officer deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// Add these methods to your existing officer.controller.js

export const getOfficerProfile = async (req, res) => {
    try {
        const officerId = req.user.id;
        
        const officer = await Officer.findById(officerId)
            .populate('station_id', 'name location')
            .select('-password');

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Convert binary profile picture to URL (like announcements)
        const responseData = officer.toObject();
        if (responseData.profile_picture && responseData.profile_picture.data) {
            responseData.profile_picture_url = `/api/officers/profile/picture`;
            // Remove binary data from response
            delete responseData.profile_picture;
        } else {
            responseData.profile_picture_url = null;
        }

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Get officer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateOfficerProfile = async (req, res) => {
    try {
        const officerId = req.user.id;
        const { first_name, last_name, email, mobile_number, radio_id } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const officer = await Officer.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        if (email !== officer.email) {
            const existingOfficer = await Officer.findOne({ 
                email, 
                _id: { $ne: officerId }
            });
            if (existingOfficer) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        officer.first_name = first_name;
        officer.last_name = last_name;
        officer.email = email;
        
        if (!officer.contact) {
            officer.contact = {};
        }
        
        if (mobile_number !== undefined) {
            officer.contact.mobile_number = mobile_number;
        }
        if (radio_id !== undefined) {
            officer.contact.radio_id = radio_id;
        }

        const savedOfficer = await officer.save();
        await savedOfficer.populate('station_id', 'name location');
        
        const officerResponse = savedOfficer.toObject();
        delete officerResponse.password;
        
        // Convert profile picture to URL
        if (officerResponse.profile_picture && officerResponse.profile_picture.data) {
            officerResponse.profile_picture_url = `/api/officers/profile/picture`;
            delete officerResponse.profile_picture;
        } else {
            officerResponse.profile_picture_url = null;
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: officerResponse
        });
    } catch (error) {
        console.error('Update officer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
/**
 * New controller function to update the officer's profile picture URL.
 * Assumes the image has already been uploaded and the URL is provided in the request body.
 */
export const updateOfficerProfilePicture = async (req, res) => {
    try {
        const officerId = req.user.id;
        const { profile_picture } = req.body;

        if (!profile_picture || !profile_picture.data) {
            return res.status(400).json({
                success: false,
                message: 'Profile picture data is required'
            });
        }

        const officer = await Officer.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Convert base64 to Buffer (like announcement attachments)
        let base64Data = profile_picture.data;
        if (base64Data.startsWith('data:')) {
            base64Data = base64Data.split(',')[1] || base64Data;
        }
        const buffer = Buffer.from(base64Data, 'base64');

        // Store binary data in MongoDB
        officer.profile_picture = {
            data: buffer,
            mimetype: profile_picture.mimetype || profile_picture.type || 'image/jpeg',
            filename: profile_picture.filename || profile_picture.name || 'profile.jpg',
            size: buffer.length
        };

        await officer.save();
        await officer.populate('station_id', 'name location');

        const officerResponse = officer.toObject();
        delete officerResponse.password;
        
        // Return URL instead of binary data
        if (officerResponse.profile_picture) {
            officerResponse.profile_picture_url = `/api/officers/profile/picture`;
            delete officerResponse.profile_picture;
        }

        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: officerResponse
        });
    } catch (error) {
        console.error('Update profile picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const getOfficerProfilePicture = async (req, res) => {
    try {
        const officerId = req.user.id;

        const officer = await Officer.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        if (!officer.profile_picture || !officer.profile_picture.data) {
            return res.status(404).json({
                success: false,
                message: 'No profile picture found'
            });
        }

        const picture = officer.profile_picture;
        
        if (!Buffer.isBuffer(picture.data)) {
            return res.status(500).json({
                success: false,
                message: 'Invalid profile picture data'
            });
        }

        console.log(`Serving profile picture: ${picture.filename}, type: ${picture.mimetype}, size: ${picture.data.length}`);
        
        const encodedFilename = encodeURIComponent(picture.filename);
        
        res.set('Content-Type', picture.mimetype || 'image/jpeg');
        res.set('Content-Length', picture.data.length);
        res.set('Content-Disposition', `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        
        res.send(picture.data);
    } catch (error) {
        console.error('Error getting profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

