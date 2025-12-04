import express from "express";
import {
  createSOS,
  getAllSOS,
  getSOSById,
  updateSOS,
  deleteSOS,
} from "../controllers/sos.controller.js";

const router = express.Router();

// Create new SOS request
router.post("/create", createSOS);

// Get all SOS requests
router.get("/", getAllSOS);

// Get single SOS request by ID
router.get("/:id", getSOSById);

// Update SOS request
router.put("/:id", updateSOS);

// Delete SOS request
router.delete("/:id", deleteSOS);

export default router;
