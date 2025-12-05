import express from "express";
// Don't forget to import the NEW function
import {
  createBlotter,
  getAllBlotters,
  getUserBlotters,
  getBlotterAttachment,
  debugBlotterAttachments,
  updateBlotter,
  deleteBlotter,
} from "../controllers/blotter.controller.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/create", authMiddleware, createBlotter);
router.get(
  "/getBlotters",
  authMiddleware,
  authorizeRoles("admin"),
  getAllBlotters
);
router.put(
  "/update/:blotterId",
  authMiddleware,
  authorizeRoles("admin"),
  updateBlotter
);
router.delete(
  "/delete/:blotterId",
  authMiddleware,
  authorizeRoles("admin"),
  deleteBlotter
);

// Kani ang para sa Mobile App:
router.get("/my-blotters/:userId", getUserBlotters);

//para ma kita image sa admin
router.get("/:blotterId/attachments/:attachmentIndex", getBlotterAttachment);

// Debug endpoint
router.get("/:blotterId/debug", authMiddleware, debugBlotterAttachments);

export default router;
