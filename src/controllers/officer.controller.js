import { Officer, PoliceStation } from "../models/index.js";
import { validateEmail } from "./auth.controller.js";
import bcrypt from 'bcryptjs';
import 'pdfkit-table';

export const createOfficer = async (req, res) => {
    try {
        const { first_name, last_name, email, role, station_id, mobile_number, status, password, is_admin } = req.body;

        if (!first_name || !last_name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, email, and role are required'
            });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (!is_admin) {
            if (!mobile_number || !station_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number and station are required for officers'
                });
            }
        }

        const existingOfficer = await Officer.findOne({ email });
        if (existingOfficer) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const officerData = {
            first_name,
            last_name,
            email,
            role,
            status: status || 'ACTIVE',
        };

        if (station_id) {
            officerData.station_id = station_id;
        }

        if (mobile_number) {
            officerData.contact = {
                mobile_number: mobile_number
            };
        }

        if (is_admin) {
            if (!password || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters for admin accounts'
                });
            }
            officerData.password = password;
        } else if (password && password.length > 0) {
            officerData.password = password;
        } else {
            const randomPassword = Math.random().toString(36).slice(-8);
            officerData.password = randomPassword;
        }

        const newOfficer = new Officer(officerData);

        if (station_id) {
            const station = await PoliceStation.findByIdAndUpdate(
                station_id,
                { $push: { officer_IDs: newOfficer._id } },
                { new: true }
            );

            if (!station) {
                return res.status(404).json({
                    success: false,
                    message: 'Station not found'
                });
            }
        }

        const savedOfficer = await newOfficer.save();
        
        const officerResponse = savedOfficer.toObject();
        delete officerResponse.password;

        res.status(201).json({
            success: true,
            message: is_admin ? 'Admin created successfully' : 'Officer created successfully',
            officer: officerResponse
        });
    } catch (error) {
        console.error('Error creating officer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

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
};

export const updateOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, role, station_id, mobile_number, status, password } = req.body;

        if (!first_name || !last_name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, email, and role are required'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const isAdmin = role.toUpperCase() === "ADMIN";
        
        if (!isAdmin) {
            if (!mobile_number || !station_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number and station are required for officers'
                });
            }
        }

        const officer = await Officer.findById(id);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        if (email !== officer.email) {
            const existingOfficer = await Officer.findOne({ 
                email, 
                _id: { $ne: id }
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
        officer.role = role;
        officer.status = status || 'ACTIVE';

        if (station_id) {
            if (officer.station_id && officer.station_id.toString() !== station_id) {
                await PoliceStation.findByIdAndUpdate(
                    officer.station_id,
                    { $pull: { officer_IDs: officer._id } }
                );
                const newStation = await PoliceStation.findByIdAndUpdate(
                    station_id,
                    { $push: { officer_IDs: officer._id } },
                    { new: true }
                );
                if (!newStation) {
                    return res.status(404).json({
                        success: false,
                        message: 'Station not found'
                    });
                }
            } else if (!officer.station_id && station_id) {
                const station = await PoliceStation.findByIdAndUpdate(
                    station_id,
                    { $push: { officer_IDs: officer._id } },
                    { new: true }
                );
                if (!station) {
                    return res.status(404).json({
                        success: false,
                        message: 'Station not found'
                    });
                }
            }
            officer.station_id = station_id;
        } else if (officer.station_id && isAdmin) {
            await PoliceStation.findByIdAndUpdate(
                officer.station_id,
                { $pull: { officer_IDs: officer._id } }
            );
            officer.station_id = undefined;
        }

        if (!officer.contact) {
            officer.contact = {};
        }
        
        if (mobile_number !== undefined) {
            officer.contact.mobile_number = mobile_number;
        }

        if (password && password.trim() !== "") {
            officer.password = password;
        }

        const savedOfficer = await officer.save();
        
        const officerResponse = savedOfficer.toObject();
        delete officerResponse.password;

        res.status(200).json({
            success: true,
            message: 'Officer updated successfully',
            officer: officerResponse
        });
    } catch (error) {
        console.error('Update officer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

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
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Get the authenticated officer's profile
 */
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

/**
 * Update the authenticated officer's profile details
 */
export const updateOfficerProfile = async (req, res) => {
    try {
        const officerId = req.user.id;
        const { first_name, last_name, email, mobile_number } = req.body;

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
 * Change the authenticated officer's password
 */
/**
 * Change the authenticated officer's password
 */
export const changeOfficerPassword = async (req, res) => {
    try {
        const officerId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const officer = await Officer.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        if (!officer.password) {
            return res.status(400).json({
                success: false,
                message: 'Officer does not have a password set yet. Please use the reset password feature.'
            });
        }

        const isPasswordValid = await bcrypt.compare(current_password, officer.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const isSamePassword = await bcrypt.compare(new_password, officer.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as the current password'
            });
        }
        officer.password = new_password;
        await officer.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update the authenticated officer's profile picture
 * Stores base64 image as binary data in MongoDB (matches announcement approach)
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

/**
 * Serve the authenticated officer's profile picture as binary data
 * Used for displaying their own profile picture
 */
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

/**
 * Get any officer's profile picture by their ID
 * Used for displaying officer pictures in blotters, assignments, etc.
 */
export const getOfficerProfilePictureById = async (req, res) => {
    try {
        const { officerId } = req.params;

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

        console.log(`Serving officer ${officerId} profile picture: ${picture.filename}, type: ${picture.mimetype}, size: ${picture.data.length}`);
        
        const encodedFilename = encodeURIComponent(picture.filename);
        
        res.set('Content-Type', picture.mimetype || 'image/jpeg');
        res.set('Content-Length', picture.data.length);
        res.set('Content-Disposition', `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        
        res.send(picture.data);
    } catch (error) {
        console.error('Error getting officer profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete the authenticated officer's profile picture
 */
export const deleteOfficerProfilePicture = async (req, res) => {
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
                message: 'No profile picture to delete'
            });
        }

        // Remove the profile picture
        officer.profile_picture = undefined;
        await officer.save();
        await officer.populate('station_id', 'name location');

        const officerResponse = officer.toObject();
        delete officerResponse.password;
        officerResponse.profile_picture_url = null;

        res.status(200).json({
            success: true,
            message: 'Profile picture removed successfully',
            data: officerResponse
        });
    } catch (error) {
        console.error('Delete profile picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete the authenticated officer's account
 */
export const deleteOfficerAccount = async (req, res) => {
    try {
        const officerId = req.user.id;

        const officer = await Officer.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Remove officer from station's officer list
        if (officer.station_id) {
            await PoliceStation.findByIdAndUpdate(
                officer.station_id,
                { $pull: { officer_IDs: officerId } }
            );
        }

        // Delete the officer
        await Officer.findByIdAndDelete(officerId);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete officer account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};