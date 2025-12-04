import { Officer, PoliceStation } from "../models/index.js";
import PDFDocument from "pdfkit";
import "pdfkit-table";

export const createPoliceStation = async (req, res) => {
  try {
    const {
      name,
      address,
      phone_number,
      email,
      landline,
      latitude,
      longitude,
    } = req.body;

    if (!name || !address || !phone_number || !landline) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newPoliceStation = new PoliceStation({
      name,
      address,
      contact: { phone_number, email, landline },
      location: { latitude, longitude },
    });

    await newPoliceStation.save();

    res.status(201).json({
      success: true,
      data: newPoliceStation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
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

export const generateStationsPdf = async (req, res) => {
  try {
    const stations = await PoliceStation.find().populate(
      "officer_IDs",
      "first_name last_name"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="stations.pdf"');

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Police Stations Report", { align: "center" });
    doc.moveDown(0.5);

    const table = {
      headers: [
        "Custom ID",
        "Name",
        "Address",
        "Phone",
        "Landline",
        "Email",
        "Officers Count",
        "Created At",
      ],
      rows: stations.map((s) => [
        s.custom_id || "",
        s.name || "",
        s.address || "",
        (s.contact && s.contact.phone_number) || "",
        (s.contact && s.contact.landline) || "",
        (s.contact && s.contact.email) || "",
        Array.isArray(s.officer_IDs) ? String(s.officer_IDs.length) : "0",
        s.created_at ? new Date(s.created_at).toLocaleString() : "",
      ]),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, i) => doc.font("Helvetica").fontSize(9),
    });

    doc.end();
  } catch (error) {
    console.error("generateStationsPdf error", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updatePoliceStation = async (req, res) => {
    try {
        const { id } = req.params;
        const {name, address, phone_number, email, landline, latitude, longitude} = req.body;

        if(!name || !address || !phone_number || !landline) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const updates = {
            name,
            address,
            contact: { phone_number, email, landline },
            location: { latitude, longitude }
        };

        const station = await PoliceStation.findByIdAndUpdate(id, updates, { new: true });
        if (!station) {
            return res.status(404).json({
                success: false,
                message: 'Police Station not found'
            });
        }
        res.status(200).json({
            success: true,
            data: station
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error: " + error.message,
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
