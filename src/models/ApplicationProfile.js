import mongoose from "mongoose";

// Personal Info subdocument
const personalInfoSchema = new mongoose.Schema(
  {
    givenName: String,
    middleName: String,
    surname: String,
    qualifier: String,
    sex: { type: String, enum: ["Male", "Female"] },
    civilStatus: String,
    birthdate: Date,
    isPWD: { type: Boolean, default: false },
    isFirstTimeJobSeeker: { type: Boolean, default: false },
    nationality: String,
    birthPlace: String,
    otherCountry: String,
  },
  { _id: false }
);

// Address subdocument
const addressSchema = new mongoose.Schema(
  {
    houseNo: String,
    street: String,
    city: String,
    barangay: String,
    province: String,
    postalCode: String,
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
      given: String,
      middle: String,
      surname: String,
      qualifier: String,
      birthPlace: String,
      otherCountry: String,
    },
    mother: {
      given: String,
      middle: String,
      surname: String,
      qualifier: String,
      birthPlace: String,
      otherCountry: String,
    },
    spouse: {
      given: String,
      middle: String,
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
      identifyingMarks: String,
      bloodType: String,
      religion: String,
      education: String,
      occupation: String,
    },
  },
  { timestamps: true }
);

const ApplicationProfile = mongoose.model(
  "ApplicationProfile",
  applicationProfileSchema
);
export default ApplicationProfile;
