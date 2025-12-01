import express from 'express';
import { createOfficer, getAllOfficers, updateOfficer, deleteOfficer } from '../controllers/officer.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, authorizeRoles('admin'), createOfficer);
router.get('/all', authMiddleware, authorizeRoles('admin'), getAllOfficers);
router.put('/update/:id', authMiddleware, authorizeRoles('admin'), updateOfficer);
router.delete('/delete/:id', authMiddleware, authorizeRoles('admin'), deleteOfficer);

export default router;