import User from "../models/User.js";
import ApplicationProfile from "../models/ApplicationProfile.js";

/**
 * Get current user's application
 */
/**
 * Get current user's application
 */
export const getApplication = async (req, res) => {
  try {
    const profile = await ApplicationProfile.findOne({ user: req.user.id });

    const fallbackProfile = {
      personal_info: {
        givenName: "",
        middleName: "",
        surname: "",
        qualifier: "",
        sex: "",
        civilStatus: "",
        birthdate: "",
        isPWD: false,
        isFirstTimeJobSeeker: false,
        nationality: "",
        birthPlace: "",
        otherCountry: "",
      },
      address: {
        houseNo: "",
        street: "",
        city: "",
        barangay: "",
        province: "",
        postalCode: "",
        country: "",
        email: "",
        mobile: "",
        telephone: "",
      },
      family: {
        father: {
          given: "",
          middle: "",
          surname: "",
          qualifier: "",
          birthPlace: "",
          otherCountry: "",
        },
        mother: {
          given: "",
          middle: "",
          surname: "",
          qualifier: "",
          birthPlace: "",
          otherCountry: "",
        },
        spouse: {
          given: "",
          middle: "",
          surname: "",
          qualifier: "",
        },
      },
      other_info: {
        height: "",
        weight: "",
        complexion: "",
        identifyingMarks: "",
        bloodType: "",
        religion: "",
        education: "",
        occupation: "",
      },
      profile_picture: "",
    };

    return res.json({
      profile: profile || fallbackProfile,
    });
  } catch (err) {
    console.error("getApplication error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Save or update current user's application
 */
export const saveApplication = async (req, res) => {
  try {
    const { personal_info, address, family, other_info } = req.body;

    // SAVE TO APPLICATION PROFILE
    let profile = await ApplicationProfile.findOne({ user: req.user.id });

    if (!profile) {
      profile = new ApplicationProfile({
        user: req.user.id,
        personal_info,
        address,
        family,
        other_info,
      });
    } else {
      profile.personal_info = {
        ...(profile.personal_info || {}),
        ...personal_info,
      };
      profile.address = { ...(profile.address || {}), ...address };
      profile.family = { ...(profile.family || {}), ...family };
      profile.other_info = { ...(profile.other_info || {}), ...other_info };
    }

    await profile.save();

    // SYNC ONLY EXISTING FIELDS TO USER
    const user = await User.findById(req.user.id);
    if (user) {
      if (personal_info) {
        user.personal_info = {
          ...user.personal_info,
          ...personal_info,
        };
      }

      // SAFE ADDRESS SYNC — prevents overwriting required fields
      if (address) {
        const updatedAddress = { ...(user.address || {}) };

        for (const key of Object.keys(address)) {
          const value = address[key];

          // Ignore empty or null fields to avoid validation errors
          if (value !== "" && value !== null && value !== undefined) {
            updatedAddress[key] = value;
          }
        }

        user.address = updatedAddress;
      }

      await user.save();
    }

    return res.json({
      success: true,
      message: "Application form saved successfully",
      profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Admin: get any user's application by user ID
 */
export const getUserApplicationById = async (req, res) => {
  try {
    const profile = await ApplicationProfile.findOne({ user: req.params.id });

    if (!profile) {
      return res.status(404).json({
        message: "Application profile not found",
      });
    }

    res.json({ profile });
  } catch (err) {
    console.error("getUserApplicationById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
