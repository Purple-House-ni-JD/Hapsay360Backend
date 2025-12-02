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

// Attachment subdocument
const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // photo, video, document
    url: { type: String, required: true },
    name: { type: String }, // optional for documents
  },
  { _id: false }
);

// Unified Blotter Schemay
const blotterSchema = new mongoose.Schema(
  {
    custom_id: {
      type: String,
      unique: true,
      default: () => generateId("BLT"),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reporter: { type: reporterSchema, required: true },
    incident: { type: incidentSchema, required: true },
    attachments: { type: [attachmentSchema], default: [] },

    // Admin fields
    assigned_Officer: { type: mongoose.Schema.Types.ObjectId, ref: "Officer" },
    notes: { type: String, default: "" },

    policeStation: {
      id: Number,
      name: String,
      address: String,
      latitude: Number,
      longitude: Number,
      distance: Number, // in km
      estimatedTime: Number, // in minutes
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
    const count = await mongoose.model("Blotter").countDocuments();
    const sequence = String(count + 1).padStart(6, "0");
    this.blotterNumber = `BLT-${year}${month}-${sequence}`;
  }
  next();
});

// Indexes for faster queries
blotterSchema.index({ status: 1, created_at: -1 });
blotterSchema.index({ userId: 1 });
blotterSchema.index({ "reporter.contactNumber": 1 });

const Blotter = mongoose.model("Blotter", blotterSchema);

export default Blotter;
