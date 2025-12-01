import express from 'express';
import { createPoliceStation, getStations, deletePoliceStation } from '../controllers/policeStation.controller.js';

const router = express.Router();

router.post('/create', createPoliceStation);
router.get('/getStations', getStations);
router.delete('/delete/:id', deletePoliceStation);

export default router;