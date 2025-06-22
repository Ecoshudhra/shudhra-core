const { validationResult } = require('express-validator');
const Otp = require("../models/OTP.model")
const Citizen = require('../models/Citizen.model');
const BlacklistedToken = require('../models/BlacklistedToken.model')
const { hashPassword, comparePassword } = require('../utils/password.util');
const { generateOtp, sendOtpEmail } = require('./mail/otp.service');
const { createToken, verifyToken } = require('../utils/jwt.util');

// Register new Citizen (signup)
exports.registerCitizen = async (req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    const { name, email, phone, password } = req.body;

    const existing = await Citizen.findOne({ $or: [{ email: email }, { phone: phone }] });
    if (existing) {
        throw { message: 'Citizen with this email or phone already exists', statusCode: 400 };
    }

    const hashedPassword = await hashPassword(password);

    const citizen = new Citizen({
        name,
        email,
        phone,
        password: hashedPassword,
    });

    await citizen.save();
    delete citizen._doc.password;

    return { message: 'Citizen registered successfully', citizen };
};

// Login Citizen (send OTP)
exports.loginCitizen = async (req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }
    const { email, password } = req.body;

    const citizen = await Citizen.findOne({ email });
    if (!citizen) {
        throw { message: 'Citizen not found', statusCode: 404 };
    }

    const isMatch = await comparePassword(password, citizen.password);
    if (!isMatch) {
        throw { message: 'Invalid password', statusCode: 401 };
    }

    const otp = generateOtp();

    await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    return { message: `OTP sent to email ${email}(Citizen) . Please verify to complete login.` };
};

// OTP Validation and JWT token generation of Citizen
exports.validateOtpCitizen = async (req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    const { otp, email } = req.body;

    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
        throw { message: 'Invalid OTP', statusCode: 400 };
    }

    if (validOtp.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: validOtp._id });
        throw { message: 'OTP has expired', statusCode: 400 };
    }

    await Otp.deleteOne({ _id: validOtp._id });

    const citizen = await Citizen.findOne({ email });
    const token = createToken({ id: citizen._id, email: citizen.email, type: 'citizen' });

    return {
        message: 'OTP verified, login successful',
        token,
        citizen: {
            id: citizen._id,
            name: citizen.name,
            email: citizen.email,
        },
    };
};

// Profile fetch of Citizen
exports.getCitizenProfile = async (citizenId) => {
    const citizen = await Citizen.findById(citizenId).select('-password');
    if (!citizen) {
        throw { message: 'Citizen not found', statusCode: 404 };
    }
    return { profile: citizen };
};

// Logout and blacklist token of Citizen
exports.logoutCitizen = async (authHeader) => {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    await BlacklistedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
    });

    return { message: 'Logged out successfully' };
};