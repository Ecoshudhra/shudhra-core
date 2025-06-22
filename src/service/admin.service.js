const { validationResult } = require('express-validator');
const Otp = require("../models/OTP.model")
const Admin = require('../models/Admin.model');
const BlacklistedToken = require('../models/BlacklistedToken.model')
const Municipality = require("../models/Municipality.model");
const { hashPassword, comparePassword } = require('../utils/password.util');
const { generateOtp, sendOtpEmail } = require('./mail/otp.service');
const { createToken, verifyToken } = require('../utils/jwt.util');
const { default: mongoose } = require('mongoose');
const { sendMunicipalityApprovedEmail, sendMunicipalityRejectEmail } = require('./mail/municipalityStatus.service');

// Register new Admin (signup)
exports.registerAdmin = async (req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    const { name, email, phone, password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
        throw { message: 'Admin with this email already exists', statusCode: 400 };
    }

    const hashedPassword = await hashPassword(password);

    const admin = new Admin({
        name,
        email,
        phone,
        password: hashedPassword,
    });

    await admin.save();
    delete admin._doc.password;

    return { message: 'Admin registered successfully', admin };
};

// Login admin (send OTP)
exports.loginAdmin = async (req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw { message: 'Admin not found', statusCode: 404 };
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
        throw { message: 'Invalid password', statusCode: 401 };
    }

    const otp = generateOtp();
    console.log(otp);


    await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    return { message: `OTP sent to email ${email}(Admin). Please verify to complete login.` };
};

// OTP Validation and JWT token generation of admin
exports.validateOtpAdmin = async (req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    const { otp, email } = req.body;

    const validOtp = await Otp.findOne({ email, otp });
    console.log(validOtp);

    if (!validOtp) {
        throw { message: 'Invalid OTP', statusCode: 400 };
    }

    if (validOtp.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: validOtp._id });
        throw { message: 'OTP has expired', statusCode: 400 };
    }

    await Otp.deleteOne({ _id: validOtp._id });

    const admin = await Admin.findOne({ email });
    const token = createToken({ id: admin._id, email: admin.email, type: 'admin' });

    return {
        message: 'OTP verified, login successful',
        token,
        admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
        },
    };
};

// Profile fetch of Admin
exports.getAdminProfile = async (userId) => {
    const admin = await Admin.findById(userId).select('-password');
    if (!admin) {
        throw { message: 'Admin not found', statusCode: 404 };
    }
    return { profile: admin };
};

// Logout and blacklist token of Admin
exports.logoutAdmin = async (authHeader) => {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    await BlacklistedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
    });

    return { message: 'Logged out successfully' };
};