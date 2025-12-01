import { Officer, PoliceStation } from "../models/index.js";
import "pdfkit-table";

export const createPoliceStation = async (req, res) => {
  try {
    const { name, address, phoneNumber, email, landline, officerId } = req.body;

    if (
      !name ||
      !address ||
      !phoneNumber ||
      !landline ||
      !email ||
      !officerId
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const officer = await Officer.findOne({ _id: officerId });
    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    const newPoliceStation = new PoliceStation({
      name,
      address,
      contact: { phone_number: phoneNumber, email, landline },
      officer_IDs: [officer._id],
    });

    await newPoliceStation.save();

    res.status(201).json({
      success: true,
      data: newPoliceStation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const getStations = async (req, res) => {
  try {
    const stations = await PoliceStation.find().populate(
      "officer_IDs",
      "-password"
    );
    res.status(200).json({
      success: true,
      data: stations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const deletePoliceStation = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await PoliceStation.findByIdAndDelete(id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Police Station not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Police Station deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const getPoliceStations = async (req, res) => {
  try {
    // select 'location' so the SOS screen can calculate distance
    const stations = await PoliceStation.find().select(
      "name address location contact"
    );

    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
