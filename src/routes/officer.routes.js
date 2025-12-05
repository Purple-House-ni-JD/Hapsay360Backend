import express from 'express';
import { 
    createOfficer, 
    getAllOfficers, 
    updateOfficer, 
    deleteOfficer,
    getOfficerProfile,
    updateOfficerProfile,
    updateOfficerProfilePicture,
    deleteOfficerProfilePicture, 
    deleteOfficerAccount, 
    getOfficerProfilePicture,
    getOfficerProfilePictureById
} from '../controllers/officer.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Existing routes
router.post('/create', authMiddleware, createOfficer);
router.get('/all', authMiddleware, getAllOfficers);
router.put('/update/:id', authMiddleware, updateOfficer);
router.delete('/delete/:id', authMiddleware, deleteOfficer);

// Profile routes
router.get('/profile', authMiddleware, getOfficerProfile);
router.put('/profile', authMiddleware, updateOfficerProfile);
router.put('/profile/picture', authMiddleware, updateOfficerProfilePicture);
router.delete('/profile/picture', authMiddleware, deleteOfficerProfilePicture);  // ADD THIS
router.get('/profile/picture', authMiddleware, getOfficerProfilePicture);

// Get any officer's picture by ID (for blotters, etc.)
router.get('/:officerId/picture', authMiddleware, getOfficerProfilePictureById);

router.delete('/profile/picture', authMiddleware, deleteOfficerProfilePicture);
router.delete('/profile', authMiddleware, deleteOfficerAccount);

export default router;