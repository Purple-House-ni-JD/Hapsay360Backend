import mongoose from "mongoose";
import { generateId } from "../lib/idGenerator.js";

// Location subdocument
const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: "" },
  },
  { _id: false }
);

// Incident subdocument
const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Theft", "Robbery", "Assault", "Accident", "Other"],
      default: "Theft",
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: locationSchema, required: true },
    description: { type: String, required: true, minlength: 10 },
  },
  { _id: false }
);

// Reporter subdocument
const reporterSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// UPDATED: Attachment subdocument (matches announcement pattern)
const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

// Unified Blotter Schema
const blotterSchema = new mongoose.Schema(
  {
    custom_id: {
      type: String,
      unique: true,
      default: () => generateId("BLT"),
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reporter: { type: reporterSchema, required: true },
    incident: { type: incidentSchema, required: true },
    attachments: { type: [attachmentSchema], default: [] },

    assigned_Officer: { type: mongoose.Schema.Types.ObjectId, ref: "Officer" },
    notes: { type: String, default: "" },
    policeStation: {
      id: Number,
      name: String,
      address: String,
      latitude: Number,
      longitude: Number,
      distance: Number,
      estimatedTime: Number,
    },

    status: {
      type: String,
      enum: ["Pending", "Under Review", "Investigating", "Resolved", "Closed"],
      default: "Pending",
    },

    blotterNumber: { type: String, unique: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Pre-save hook to generate blotter number
blotterSchema.pre("save", async function (next) {
  if (!this.blotterNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const prefix = `BLT-${year}${month}`;

    // 1. Find the blotter with the HIGHEST number for this month
    const lastBlotter = await mongoose
      .model("Blotter")
      .findOne({ blotterNumber: { $regex: `^${prefix}` } })
      .sort({ blotterNumber: -1 }) // Sort Descending to get the biggest number
      .select("blotterNumber");

    let sequence = 1;

    if (lastBlotter && lastBlotter.blotterNumber) {
      // 2. Extract the sequence part (e.g. "000004")
      const parts = lastBlotter.blotterNumber.split("-");
      const lastSeq = parseInt(parts[2]);

      // 3. Add 1 to make it "000005"
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    this.blotterNumber = `${prefix}-${String(sequence).padStart(6, "0")}`;
  }
  next();
});

const Blotter = mongoose.model("Blotter", blotterSchema);

export default Blotter;
