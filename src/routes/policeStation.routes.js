import express from "express";
import {
  createPoliceStation,
  getStations,
  deletePoliceStation,
} from "../controllers/policeStation.controller.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, authorizeRoles("admin"), createPoliceStation);
router.get("/getStations", authMiddleware, authorizeRoles("admin"), getStations);
router.delete("/delete/:id", authMiddleware, authorizeRoles("admin"), deletePoliceStation);

export default router;
