import {createAnnouncement, getAnnouncements, deleteAnnouncement, updateAnnouncement, getAttachment} from '../controllers/announcement.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import express from 'express';

const router = express.Router();

// Public endpoint to serve attachments (no auth required for viewing)
// This must come BEFORE other routes with :announcementId to avoid route conflicts
router.get('/:announcementId/attachments/:attachmentIndex', getAttachment);

router.post('/create', authMiddleware, authorizeRoles('admin'), createAnnouncement);
router.get('/', authMiddleware, authorizeRoles('admin'), getAnnouncements);
router.delete('/delete/:announcementId', authMiddleware, authorizeRoles('admin'), deleteAnnouncement);
router.put('/update/:announcementId', authMiddleware, authorizeRoles('admin'), updateAnnouncement);

export default router;