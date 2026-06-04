const { getProfile, upsertProfile } = require('./profile.service');

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await getProfile(userId);

    res.status(200).json({
      user: req.user,
      profile
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, avatar_url, phone, email } = req.body;

    const profile = await upsertProfile({
      id: userId,
      email,
      phone,
      full_name,
      avatar_url
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
};
