import express from "express";
import {
  createPoliceStation,
  getStations,
  generateStationsPdf,
  deletePoliceStation,
  updatePoliceStation
} from "../controllers/policeStation.controller.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("admin"),
  createPoliceStation
);
router.get("/getStations", authMiddleware, getStations);
router.get(
  "/export/pdf",
  authMiddleware,
  authorizeRoles("admin"),
  generateStationsPdf
);
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deletePoliceStation
);
router.put(
  "/update/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updatePoliceStation
);

export default router;
