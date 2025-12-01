import express from "express";
import { createSOS } from "../controllers/sos.controller.js";

const router = express.Router();

router.post("/create", createSOS);

export default router;
