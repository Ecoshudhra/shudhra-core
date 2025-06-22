const { requestMunicipality, loginMunicipality, validateOtpMunicipality, getMunicipalityProfile, logoutMunicipality, fetchMunicipalities, updateProfileOfMunicipalities, approveMunicipalityById, rejectMunicipalityById } = require("../service/municipality.service");

// Handle request for municipality approval
exports.municipalityRequest = (io) => async (req, res) => {
  try {
    const result = await requestMunicipality(req, io);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Login with email and password (sends OTP)
exports.municipalityLogin = (io) => async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginMunicipality(req, email, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

// OTP validation
exports.municipalityValidateWithOTP = (io) => async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await validateOtpMunicipality(req, email, otp);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

// Get profile
exports.municipalityProfile = () => async (req, res) => {
  try {
    const result = await getMunicipalityProfile(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] Failed to get profile of municipalities:', error);
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Logout and blacklist token
exports.municipalityLogout = () => async (req, res) => {
  try {
    const token = req.headers?.authorization || req.body?.authorization;
    const result = await logoutMunicipality(token);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] Failed to logout municipalities:', error);
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getAllMunicipalities = (io) => async (req, res) => {
  try {
    const result = await fetchMunicipalities(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] Failed to fetch municipalities:', error);
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.approveMunicipality = (io) => async (req, res) => {
  try {
    const { id } = req.params;
    const result = await approveMunicipalityById(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.rejectMunicipality = (io) => async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body?.reason;

    const result = await rejectMunicipalityById(id, reason);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


exports.updateMunicipalityProfile = async (req, res) => {
  try {
    const result = await updateProfileOfMunicipalities(req, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ERROR] Failed to fetch municipalities:', error);
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};


