const Municipality = require('../models/Municipality.model');
const BlacklistedToken = require('../models/BlacklistedToken.model');
const Otp = require('../models/OTP.model');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { createToken, verifyToken } = require('../utils/jwt.util');
const { generateOtp, sendOtpEmail } = require('./mail/otp.service');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Notification = require('../models/Notification.model');
const sendNotification = require('../utils/sendNotification');

// Request new municipality (signup)
exports.requestMunicipality = async (req, io) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw { message: errors.array()[0].msg, statusCode: 422 };
  }

  const { name, email, phone, password, type, ulbCode, registrationNumber, govCertificateUrl, location: { zone, coordinates, state, district, city, address, pincode, wardNumber } } = req.body;

  const existing = await Municipality.findOne({ $or: [{ primaryEmail: email }, { secondaryEmail: email }, { phone: phone }, { registrationNumber: registrationNumber }, { ulbCode: ulbCode }] });

  if (existing) {
    throw { message: 'Municipality with this Data already exists', statusCode: 400 };
  }

  const hashedPassword = await hashPassword(password);

  const municipality = new Municipality({
    name,
    primaryEmail: email,
    phone,
    password: hashedPassword,

    type,
    ulbCode,
    ...(registrationNumber ? { registrationNumber } : {}),
    ...(govCertificateUrl ? { govCertificateUrl } : {}),

    location: {
      zone,
      coordinates,
      state,
      district,
      city,
      address,
      pincode,
      wardNumber
    },
    status: 'pending',
  });

  await municipality.save();

  // Send notification to all Admins
  await sendNotification({
    io,
    receiverId: null,
    receiverType: 'Admin',
    message: `New Municipality Request: ${municipality.name}`,
    link: `/admin/municipality/`
  });


  return { message: 'Request submitted successfully', municipality };
};

// // Login municipality (send OTP)
exports.loginMunicipality = async (req, email, password) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw { message: errors.array()[0].msg, statusCode: 422 };
  }

  const municipality = await Municipality.findOne({ $or: [{ primaryEmail: email }, { secondaryEmail: email }] });
  if (!municipality) {
    throw { message: 'Municipality not found', statusCode: 404 };
  }

  if (municipality.status !== 'approved') {
    throw { message: 'Account not approved yet', statusCode: 403 };
  }

  const isMatch = await comparePassword(password, municipality.password);
  if (!isMatch) {
    throw { message: 'Invalid password', statusCode: 401 };
  }

  const otp = generateOtp();

  await Otp.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
  });

  await sendOtpEmail(email, otp);

  return { message: `OTP sent to email ${email}(Municipality). Please verify to complete login.` };
};

// // OTP Validation and JWT token generation of municipality
exports.validateOtpMunicipality = async (req, email, otp) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw { message: errors.array()[0].msg, statusCode: 422 };
  }

  const validOtp = await Otp.findOne({ email, otp });
  if (!validOtp) {
    throw { message: 'Invalid OTP', statusCode: 400 };
  }

  if (validOtp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: validOtp._id });
    throw { message: 'OTP has expired', statusCode: 400 };
  }

  await Otp.deleteOne({ _id: validOtp._id });

  const municipality = await Municipality.findOne({ $or: [{ primaryEmail: email }, { secondaryEmail: email }] });
  const token = createToken({ id: municipality._id, email: municipality.primaryEmail, type: 'municipality' });

  return {
    message: 'OTP verified, login successful',
    token,
    municipality: {
      id: municipality._id,
      name: municipality.name,
      zone: municipality.zone,
      email: municipality.email,
      city: municipality.city,
    },
  };
};

// // Profile fetch of municipality
exports.getMunicipalityProfile = async (userId) => {
  const municipality = await Municipality.findById(userId).select('-password');
  if (!municipality) {
    throw { message: 'Municipality not found', statusCode: 404 };
  }
  return { profile: municipality };
};

// // Logout and blacklist token of municipality
exports.logoutMunicipality = async (authHeader) => {
  const token = authHeader?.split(' ')[1];
  const decoded = verifyToken(token);
  await BlacklistedToken.create({
    token,
    expiresAt: new Date(decoded.exp * 1000),
  });
  return { message: 'Logged out successfully', };
};

// fetch all municipalities with Query
exports.fetchMunicipalities = async (query = {}) => {
  const {
    lat,
    lon,
    radius = 10000,
    city = '',
    status = '',
    page = 1,
    limit = 10
  } = query;

  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;

  const hasLatLon = lat !== undefined && lon !== undefined;
  const hasOnlyOne = (lat && !lon) || (!lat && lon);

  if (hasOnlyOne) {
    return {
      success: false,
      message: "Both latitude and longitude must be provided together.",
      statusCode: 400
    };
  }

  try {
    let municipalities, totalCount;

    if (hasLatLon) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        throw {
          success: false,
          message: "Invalid latitude or longitude.",
          statusCode: 400
        };
      }

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parsedLon, parsedLat]
            },
            distanceField: "distance",
            maxDistance: Number(radius),
            spherical: true,
            query: {
              ...(status && status !== 'all' ? { status } : {}),
              ...(city ? { "location.city": { $regex: city, $options: "i" } } : {})
            }
          }
        },
        {
          $project: {
            name: 1,
            phone: 1,
            status: 1,
            "location.coordinates": 1,
            "location.city": 1,
            distance: 1
          }
        },
        { $skip: skip },
        { $limit: pageSize }
      ];

      municipalities = await Municipality.aggregate(pipeline);
      totalCount = municipalities.length;

    } else {
      // If no lat/lon, just return all municipalities with status and city matching the query
      const filters = {
        ...(status && status !== 'all' ? { status } : {}),
        ...(city ? { "location.city": { $regex: city, $options: "i" } } : {})
      };

      totalCount = await Municipality.countDocuments(filters);
      municipalities = await Municipality.find(filters)
        .skip(skip)
        .limit(pageSize)
        .select('name phone status location.city location.coordinates');
    }

    return {
      success: true,
      total: totalCount,
      page: pageNumber,
      limit: pageSize,
      data: municipalities,
      message: municipalities.length
        ? "Municipalities retrieved successfully."
        : "No municipalities found matching the criteria."
    };
  } catch (error) {
    console.error('[ERROR] fetchMunicipalities:', error);
    return {
      success: false,
      message: "Failed to fetch municipalities.",
      error: error.message || error
    };
  }
};

// approve municipality by id
exports.approveMunicipalityById = async (municipalityId) => {

  if (!municipalityId || !mongoose.Types.ObjectId.isValid(municipalityId)) {
    throw { message: 'Invalid municipality id', statusCode: 400 };
  }
  const municipality = await Municipality.findById(municipalityId);

  if (!municipality) {
    throw ({ message: 'Municipality not found', statusCode: 404 });
  }

  if (municipality.status === 'approved') {
    throw ({ message: 'Municipality already approved', statusCode: 400 });
  }

  municipality.status = 'approved';
  await municipality.save();

  await sendMunicipalityApprovedEmail(municipality.primaryEmail, municipality.name);

  return { message: 'Municipality approved successfully', municipality };
};

// reject municipality by id
exports.rejectMunicipalityById = async (municipalityId, rejectReason) => {

  if (!municipalityId || !mongoose.Types.ObjectId.isValid(municipalityId)) {
    throw { message: 'Invalid municipality id', statusCode: 400 };
  }
  if (!rejectReason) {
    throw { message: 'Invalid reject reason', statusCode: 400 };
  }
  const municipality = await Municipality.findById(municipalityId);

  if (!municipality) {
    throw ({ message: 'Municipality not found', statusCode: 404 });
  }

  if (municipality.status === 'rejected') {
    throw ({ message: 'Municipality already rejected', statusCode: 400 });
  }

  municipality.status = 'rejected';
  await municipality.save();

  await sendMunicipalityRejectEmail(municipality.primaryEmail, municipality.name, rejectReason);

  return { message: 'Municipality rejected successfully', municipality };
};

// exports.updateProfileOfMunicipalities = async (req, municipalityId) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     throw { message: errors.array()[0].msg, statusCode: 422 };
//   }

//   if (!municipalityId || !mongoose.Types.ObjectId.isValid(municipalityId)) {
//     throw { message: 'Invalid municipality id', statusCode: 400 };
//   }

//   const municipality = await Municipality.findById(municipalityId);
//   if (!municipality) {
//     throw { message: 'Municipality not found.', statusCode: 404 };
//   }
//   if (municipality.isProfileComplete) {
//     throw { message: 'Profile is already complete you cannot update it.', statusCode: 400 };
//   }

//   const { vehicle, resourceImages, manPower } = req.body;

//     municipality.vehicle = vehicle;
//     municipality.resourceImages = resourceImages;
//     municipality.manPower = {
//       male: parseInt(manPower.male),
//       female: parseInt(manPower.female)
//     };
//     municipality.isProfileComplete = true;

//     await municipality.save();
//
//   return {
//     message: 'Municipality profile updated successfully.',
//     data: municipality
//   };
// };