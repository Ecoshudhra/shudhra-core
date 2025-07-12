const Otp = require("../models/OTP.model");
const Citizen = require("../models/Citizen.model");
const BlacklistedToken = require("../models/BlacklistedToken.model");
const { hashPassword, comparePassword } = require("../utils/password.util");
const { generateOtp, sendOtpEmail } = require("./mail/otp.service");
const { createToken, verifyToken } = require("../utils/jwt.util");
const { alertNewCreated } = require("../utils/socketUtils");


exports.registerCitizenService = async (data, io) => {
    const { name, email, phone, password } = data;

    const existing = await Citizen.findOne({ $or: [{ email }, { phone }] });
    if (existing) throw { message: 'Citizen with this email or phone already exists', statusCode: 400 };

    const hashedPassword = await hashPassword(password);

    const citizen = new Citizen({ name, email, phone, password: hashedPassword });
    await citizen.save();

    delete citizen._doc.password;

    await alertNewCreated({
        io,
        receiverId: null,
        receiverType: 'Admin',
        creationType: 'Citizen',
        data: {
            _id: citizen._id,
            avatar: citizen.avatar,
            name: citizen.name,
            email: citizen.email,
            phone: citizen.phone,
        }
    });

    return { message: 'Citizen registered successfully', citizen };
};

exports.loginCitizenService = async ({ email, password }, io) => {
    const citizen = await Citizen.findOne({ email });
    if (!citizen) throw { message: 'Citizen not found', statusCode: 404 };

    const isMatch = await comparePassword(password, citizen.password);
    if (!isMatch) throw { message: 'Invalid password', statusCode: 401 };

    await Otp.deleteMany({ email });
    const otp = generateOtp();

    await Otp.create({ email, otp, expiresAt: new Date(Date.now() + 3 * 60 * 1000) });
    await sendOtpEmail(email, otp);

    return { message: `OTP sent to ${email}` };
};

exports.validateOtpService = async ({ email, otp }, io) => {
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) throw { message: 'Invalid OTP', statusCode: 400 };
    if (validOtp.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: validOtp._id });
        throw { message: 'OTP has expired', statusCode: 400 };
    }

    await Otp.deleteOne({ email });

    const citizen = await Citizen.findOne({ email });
    const token = createToken({ id: citizen._id, email: citizen.email, type: 'citizen' });

    return { message: 'OTP verified', token, citizen };
};

exports.sendOtpService = async ({ email }, io) => {
    const citizen = await Citizen.findOne({ email });
    if (!citizen) throw { message: 'User not found', statusCode: 404 };

    await Otp.deleteMany({ email });
    const otp = generateOtp();

    await Otp.create({ email, otp, expiresAt: new Date(Date.now() + 3 * 60 * 1000) });
    await sendOtpEmail(email, otp);

    return { success: true, message: `OTP resent to ${email}` };
};

exports.resetPasswordService = async ({ email, newPassword }, io, authHeader) => {
    const citizen = await Citizen.findOne({ email });
    const token = authHeader?.split(' ')[1];
    const decoded = verifyToken(token);

    if (!citizen) throw { message: 'Citizen not found', statusCode: 404 };

    const isSame = await comparePassword(newPassword, citizen.password);
    if (isSame) throw { message: 'New password cannot be the same as the current password', statusCode: 400 };

    citizen.password = await hashPassword(newPassword);
    await citizen.save();
    await BlacklistedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
    });


    return { message: 'Password has been reset successfully' };
};

exports.getCitizenProfileService = async (citizenId) => {
    const citizen = await Citizen.findById(citizenId).select('-password').lean();
    if (!citizen) throw { message: 'Citizen not found', statusCode: 404 };

    return { success: true, citizen };
};

exports.logoutCitizenService = async (authHeader) => {
    const token = authHeader?.split(' ')[1];
    const decoded = verifyToken(token);

    await BlacklistedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
    });

    return { message: 'Logged out successfully' };
};

exports.updateCitizenAddressService = async (citizenId, body) => {
    const citizen = await Citizen.findById(citizenId);
    if (!citizen) throw { message: 'Citizen not found', statusCode: 404 };

    const { coordinates, state, district, city, address, pincode } = body;

    citizen.location = {
        type: 'Point',
        coordinates,
        state,
        district,
        city,
        address,
        pincode,
    };
    citizen.isLocationUpdated = true;
    await citizen.save();

    return { message: 'Address updated successfully', citizen };
};
