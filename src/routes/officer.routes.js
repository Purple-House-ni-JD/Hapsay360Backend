import express from 'express';
import { 
    createOfficer, 
    getAllOfficers, 
    updateOfficer, 
    deleteOfficer,
    getOfficerProfile,
    updateOfficerProfile,
    updateOfficerProfilePicture
} from '../controllers/officer.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Existing routes
router.post('/create', authMiddleware, createOfficer);
router.get('/all', authMiddleware, getAllOfficers);
router.put('/update/:id', authMiddleware, updateOfficer);
router.delete('/delete/:id', authMiddleware, deleteOfficer);

// profile routes
router.get('/profile', authMiddleware, getOfficerProfile);
router.put('/profile', authMiddleware, updateOfficerProfile);
router.put('/profile/picture', authMiddleware, updateOfficerProfilePicture);

export default router;