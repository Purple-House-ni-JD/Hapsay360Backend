import express from "express";
// Don't forget to import the NEW function
import {
  createBlotter,
  getAllBlotters,
  getUserBlotters,
} from "../controllers/blotter.controller.js";

const router = express.Router();

router.post("/create", createBlotter);
router.get("/getBlotters", getAllBlotters); // Pang admin guro ni

// Kani ang para sa Mobile App:
router.get("/my-blotters/:userId", getUserBlotters);

export default router;
