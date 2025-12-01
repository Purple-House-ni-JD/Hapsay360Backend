import ApplicationProfile from "../models/ApplicationProfile.js";

/**
 * Get current user's application
 */
export const getApplication = async (req, res) => {
  try {
    const profile = await ApplicationProfile.findOne({ user: req.user.id });
    res.json({
      profile: profile || {
        personal_info: {},
        address: {},
        other_info: {},
        family: {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Save or update current user's application
 */
export const saveApplication = async (req, res) => {
  try {
    const { personal_info, address, family, other_info } = req.body;

    let profile = await ApplicationProfile.findOne({ user: req.user.id });

    if (!profile) {
      // Create new profile
      profile = new ApplicationProfile({
        user: req.user.id,
        personal_info,
        address,
        family,
        other_info,
      });
    } else {
      // Merge updates for partial update
      profile.personal_info = {
        ...(profile.personal_info || {}),
        ...personal_info,
      };
      profile.address = { ...(profile.address || {}), ...address };
      profile.family = { ...(profile.family || {}), ...family };
      profile.other_info = { ...(profile.other_info || {}), ...other_info };
    }

    // Save to MongoDB (Mongoose will enforce schema validation)
    await profile.save();

    res.json({
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
    if (!profile)
      return res.status(404).json({ message: "Application profile not found" });

    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
