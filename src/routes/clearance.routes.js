import express from "express";
import {
  createClearance,
  getAllClearances,
  getMyClearances,
  updateClearance,
  deleteClearance,
  getClearanceAttachment,
} from "../controllers/clearance.controller.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// USER ROUTES
router.post("/create", authMiddleware, authorizeRoles("user"), createClearance);

router.get(
  "/my-clearances",
  authMiddleware,
  authorizeRoles("user", "admin"),
  getMyClearances
);

// UPDATE CLEARANCE (for front-end save/confirm)
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("user", "admin"),
  updateClearance
);

// ADMIN ROUTES
router.get("/", authMiddleware, authorizeRoles("admin"), getAllClearances);
router.get("/:id/attachments/:index", getClearanceAttachment);

// Delete Admin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "user"),
  deleteClearance
);

export default router;
