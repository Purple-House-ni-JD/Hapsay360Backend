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
        // The authMiddleware already sets req.user.id
        const officerId = req.user.id;
        
        const officer = await Officer.findById(officerId)
            .populate('station_id', 'name location')
            .select('-password'); // Exclude password from response

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: officer
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
        // The authMiddleware already sets req.user.id
        const officerId = req.user.id;
        const { first_name, last_name, email, mobile_number, radio_id } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        // Validate email format (reuse your existing validateEmail function)
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Find the officer
        const officer = await Officer.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Check if email is being changed and if it already exists for another officer
        if (email !== officer.email) {
            const existingOfficer = await Officer.findOne({ 
                email, 
                _id: { $ne: officerId } // Exclude current officer
            });
            if (existingOfficer) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Update officer details
        officer.first_name = first_name;
        officer.last_name = last_name;
        officer.email = email;
        
        // Initialize contact object if it doesn't exist
        if (!officer.contact) {
            officer.contact = {};
        }
        
        // Update contact information (only if provided)
        if (mobile_number !== undefined) {
            officer.contact.mobile_number = mobile_number;
        }
        if (radio_id !== undefined) {
            officer.contact.radio_id = radio_id;
        }

        // Save the updated officer
        const savedOfficer = await officer.save();
        
        // Populate station info for response
        await savedOfficer.populate('station_id', 'name location');
        
        // Remove password from response
        const officerResponse = savedOfficer.toObject();
        delete officerResponse.password;

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
        const { profile_picture_url } = req.body;

        if (!profile_picture_url) {
            return res.status(400).json({
                success: false,
                message: 'Profile picture URL is required'
            });
        }

        const officer = await Officer.findByIdAndUpdate(
            officerId,
            { profile_picture_url: profile_picture_url },
            { new: true, select: '-password' }
        ).populate('station_id', 'name location');

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: officer
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