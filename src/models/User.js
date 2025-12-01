import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { generateId } from "../lib/idGenerator.js";

// Personal Info subdocument schema
const personalInfoSchema = new mongoose.Schema(
  {
    given_name: {
      type: String,
      required: true,
    },
    middle_name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    qualifier: {
      type: String,
      required: false,
    },
    sex: {
      type: String,
      enum: ["Male", "Female"],
      required: false,
    },
    civil_status: {
      type: String,
      required: false,
    },
    birthday: {
      type: Date,
      required: false,
    },
    pwd: {
      type: Boolean,
      default: false,
    },
    nationality: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// Address subdocument schema
const addressSchema = new mongoose.Schema(
  {
    house_no: {
      type: String,
      required: false,
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    barangay: {
      type: String,
      required: true,
    },
    postal_code: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  custom_id: {
    type: String,
    unique: true,
    required: true,
    default: () => generateId("USR"),
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  phone_number: {
    type: String,
    required: false,
  },
  personal_info: {
    type: personalInfoSchema,
    required: true,
  },
  address: {
    type: addressSchema,
    required: false,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active",
  },
  last_activity: {
    type: Date,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  profile_picture: {
    type: String,
    default: "",
  },
});

// Update updated_at before saving
userSchema.pre("save", async function (next) {
  this.updated_at = Date.now();

  if (!this.custom_id) {
    let id;
    let exists;
    do {
      id = generateId("USR");
      exists = await this.constructor.findOne({ custom_id: id });
    } while (exists);
    this.custom_id = id;
  }

  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const ApplicationProfile = mongoose.model(
  "ApplicationProfile",
  applicationProfileSchema
);
export default ApplicationProfile;
