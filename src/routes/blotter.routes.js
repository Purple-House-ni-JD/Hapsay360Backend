import express from "express";
// Don't forget to import the NEW function
import {
  createBlotter,
  getAllBlotters,
  getUserBlotters,
} from "../controllers/blotter.controller.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/create", authMiddleware, authorizeRoles("admin"), createBlotter);
router.get("/getBlotters", authMiddleware, authorizeRoles("admin"), getAllBlotters);

// Kani ang para sa Mobile App:
router.get("/my-blotters/:userId", getUserBlotters);

export default router;
