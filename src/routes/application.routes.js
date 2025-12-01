import express from "express";
import {
  getApplication,
  saveApplication,
  getUserApplicationById,
} from "../controllers/application.controller.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// User Routes
router.get(
  "/my-application",
  authMiddleware,
  authorizeRoles("user"),
  getApplication
);
router.post(
  "/my-application",
  authMiddleware,
  authorizeRoles("user"),
  saveApplication
);

// Admin Routes
router.get(
  "/user/:id",
  authMiddleware,
  authorizeRoles("admin"),
  getUserApplicationById
);

export default router;
