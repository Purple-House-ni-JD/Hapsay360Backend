import mongoose from "mongoose";
import { generateId } from "../lib/idGenerator.js";

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
    custom_id: {
      type: String,
      unique: true,
      default: () => generateId("APF"),
    },
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

applicationProfileSchema.post("save", async function () {
  try {
    const User = mongoose.model("User");

    const user = await User.findById(this.user);
    if (!user) return;
    const hasValue = (val) => val !== undefined && val !== null && val !== "";

    // only update fields that have values
    if (this.personal_info) {
      const updatedPersonalInfo = { ...(user.personal_info?.toObject() || {}) };

      if (hasValue(this.personal_info.givenName)) {
        updatedPersonalInfo.given_name = this.personal_info.givenName;
      }
      if (hasValue(this.personal_info.middleName)) {
        updatedPersonalInfo.middle_name = this.personal_info.middleName;
      }
      if (hasValue(this.personal_info.surname)) {
        updatedPersonalInfo.surname = this.personal_info.surname;
      }
      if (hasValue(this.personal_info.qualifier)) {
        updatedPersonalInfo.qualifier = this.personal_info.qualifier;
      }
      if (hasValue(this.personal_info.sex)) {
        updatedPersonalInfo.sex = this.personal_info.sex;
      }
      if (hasValue(this.personal_info.civilStatus)) {
        updatedPersonalInfo.civil_status = this.personal_info.civilStatus;
      }
      if (hasValue(this.personal_info.birthdate)) {
        updatedPersonalInfo.birthday = this.personal_info.birthdate;
      }
      if (this.personal_info.isPWD !== undefined) {
        updatedPersonalInfo.pwd = this.personal_info.isPWD;
      }
      if (hasValue(this.personal_info.nationality)) {
        updatedPersonalInfo.nationality = this.personal_info.nationality;
      }

      user.personal_info = updatedPersonalInfo;
    }

    // Sync ADDRESS - only update fields that have values
    if (this.address) {
      const updatedAddress = { ...(user.address?.toObject() || {}) };

      const fieldMap = {
        houseNo: "house_no",
        street: "street",
        city: "city",
        barangay: "barangay",
        postal_code: "postal_code",
        province: "province",
        country: "country",
      };

      for (const [appField, userField] of Object.entries(fieldMap)) {
        if (hasValue(this.address[appField])) {
          updatedAddress[userField] = this.address[appField];
        }
      }

      user.address = updatedAddress;
    }

    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.error("Error syncing ApplicationProfile to User:", err);
  }
});

const ApplicationProfile = mongoose.model(
  "ApplicationProfile",
  applicationProfileSchema
);
export default ApplicationProfile;
