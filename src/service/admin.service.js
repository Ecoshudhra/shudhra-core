const Otp = require("../models/OTP.model")
const Admin = require('../models/Admin.model');
const BlacklistedToken = require('../models/BlacklistedToken.model')
const { hashPassword, comparePassword } = require('../utils/password.util');
const { generateOtp, sendOtpEmail } = require('./mail/otp.service');
const { createToken, verifyToken } = require('../utils/jwt.util');

exports.registerAdmin = async (req, io) => {
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

exports.loginAdmin = async (req, io) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw { message: 'Admin not found', statusCode: 404 };
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
        throw { message: 'Invalid password', statusCode: 401 };
    }

    await Otp.deleteMany({ email });
    const otp = generateOtp();

    await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    return { message: `OTP sent to ${email}. Please verify to complete login.` };
};

exports.validateOtpAdmin = async (req, io) => {
    const { otp, email } = req.body;

    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) {
        throw { message: 'Invalid OTP', statusCode: 400 };
    }

    if (validOtp.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: validOtp._id });
        throw { message: 'OTP has expired', statusCode: 400 };
    }

    await Otp.deleteMany({ email });

    const admin = await Admin.findOne({ email });
    const token = createToken({ id: admin._id, email: admin.email, type: 'admin' });

    return {
        message: 'OTP verified successfully',
        token,
        admin,
    };
};

exports.getAdminProfile = async (userId) => {
    const admin = await Admin.findById(userId).select('-password').lean();
    if (!admin) {
        throw { message: 'Admin not found', statusCode: 404 };
    }
    return { admin };
};

exports.logoutAdmin = async (authHeader) => {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    await BlacklistedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
    });

    return { message: 'Logged out successfully' };
};