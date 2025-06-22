
const { registerCitizen, loginCitizen, getCitizenProfile, logoutCitizen, validateOtpCitizen } = require("../service/citizen.service");

// Handle request for Citizen register
exports.citizenRegister = (io) => async (req, res) => {
  try {
    const result = await registerCitizen(req, io);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// Login with email and password (sends OTP) of citizen
exports.citizenLogin = (io) => async (req, res) => {
  try {
    const result = await loginCitizen(req, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// OTP validation for citizen
exports.citizenValidateWithOTP = (io) => async (req, res) => {
  try {
    const result = await validateOtpCitizen(req, io);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// Get profile of citizen
exports.citizenProfile = () => async (req, res) => {
  try {
    const result = await getCitizenProfile(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// Logout and blacklist token of citizen
exports.citizenLogout = () => async (req, res) => {
  try {
    const token = req.headers?.authorization || req.body?.authorization;
    const result = await logoutCitizen(token);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};



