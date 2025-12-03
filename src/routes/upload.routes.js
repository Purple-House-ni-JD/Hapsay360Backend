import express from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/upload.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

// Single file upload
router.post('/single', authMiddleware, authorizeRoles('admin'), upload.single('file'), uploadFile);

// Multiple files upload
router.post('/multiple', authMiddleware, authorizeRoles('admin'), upload.array('files', 10), uploadMultipleFiles);

export default router;

