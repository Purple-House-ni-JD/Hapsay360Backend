import mongoose from "mongoose";

// Personal Info subdocument
const personalInfoSchema = new mongoose.Schema(
  {
    given_name: String,
    middle_name: String,
    surname: String,
    qualifier: String,
    sex: { type: String, enum: ["Male", "Female"] },
    civil_status: String,
    birthday: Date,
    pwd: { type: Boolean, default: false },
    first_time_job_seeker: { type: Boolean, default: false },
    nationality: String,
    birth_place: String,
    other_country: String,
  },
  { _id: false }
);

// Address subdocument
const addressSchema = new mongoose.Schema(
  {
    house_no: String,
    street: String,
    city: String,
    barangay: String,
    province: String,
    postal_code: String,
    country: String,
    email: String,
    mobile: String,
    telephone: String,
  },
  { _id: false }
);

// Family Info subdocument
const familySchema = new mongoose.Schema(
  {
    father: {
      given_name: String,
      middle_name: String,
      surname: String,
      qualifier: String,
      birth_place: String,
      other_country: String,
    },
    mother: {
      given_name: String,
      middle_name: String,
      surname: String,
      qualifier: String,
      birth_place: String,
      other_country: String,
    },
    spouse: {
      given_name: String,
      middle_name: String,
      surname: String,
      qualifier: String,
    },
  },
  { _id: false }
);

// Main ApplicationProfile schema
const applicationProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    personal_info: { type: personalInfoSchema },

    address: { type: addressSchema },

    family: { type: familySchema },

    other_info: {
      height: String,
      weight: String,
      complexion: String,
      identifying_marks: String,
      blood_type: String,
      religion: String,
      education: String,
      occupation: String,
    },
  },
  { timestamps: true }
);

const ApplicationProfile =
  mongoose.models.ApplicationProfile ||
  mongoose.model("ApplicationProfile", applicationProfileSchema);
export default ApplicationProfile;
