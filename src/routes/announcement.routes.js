import {createAnnouncement, getAnnouncements, deleteAnnouncement, updateAnnouncement} from '../controllers/announcement.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.post('/create', authMiddleware, authorizeRoles('admin'), createAnnouncement);
router.get('/', authMiddleware, authorizeRoles('admin'), getAnnouncements);
router.delete('/delete/:announcementId', authMiddleware, authorizeRoles('admin'), deleteAnnouncement);
router.put('/update/:announcementId', authMiddleware, authorizeRoles('admin'), updateAnnouncement);
export default router;