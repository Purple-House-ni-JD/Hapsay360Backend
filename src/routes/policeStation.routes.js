import express from "express";
import {
  createPoliceStation,
  getStations,
  deletePoliceStation,
  getPoliceStations,
} from "../controllers/policeStation.controller.js";

const router = express.Router();

router.post("/create", createPoliceStation);
router.get("/getStations", getStations);
router.delete("/delete/:id", deletePoliceStation);

router.get("/", getPoliceStations);

export default router;
