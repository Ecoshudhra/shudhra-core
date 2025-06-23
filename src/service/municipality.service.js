const Municipality = require("../models/Municipality.model");
const Otp = require("../models/OTP.model");
const BlacklistedToken = require("../models/BlacklistedToken.model");
const { hashPassword, comparePassword } = require("../utils/password.util");
const { createToken, verifyToken } = require("../utils/jwt.util");
const { generateOtp, sendOtpEmail } = require("./mail/otp.service");
const sendNotification = require("../utils/sendNotification");
const { sendMunicipalityApprovedEmail, sendMunicipalityRejectEmail } = require("./mail/municipalityStatus.service");
const mongoose = require("mongoose");


exports.requestMunicipalityService = async (data, io) => {
  const { name, email, phone, password, type, ulbCode, registrationNumber, govCertificateUrl, location } = data;

  const existing = await Municipality.findOne({
    $or: [
      { primaryEmail: email }, { secondaryEmail: email },
      { phone }, { registrationNumber },
      { ulbCode }
    ]
  });
  if (existing) throw { message: "Duplicate municipality", statusCode: 400 };

  const hashedPassword = await hashPassword(password);
  const municipality = new Municipality({
    name, primaryEmail: email, phone, password: hashedPassword,
    type, ulbCode, registrationNumber, govCertificateUrl,
    location, status: "pending"
  });
  await municipality.save();

  await sendNotification({
    io,
    receiverId: null,
    receiverType: "Admin",
    message: `New Municipality Request: ${name}`,
    link: "/admin/municipality"
  });

  return { message: "Request submitted successfully", municipality };
};


exports.loginMunicipalityService = async ({ email, password }, io) => {
  const municipality = await Municipality.findOne({
    $or: [{ primaryEmail: email }, { secondaryEmail: email }]
  });
  if (!municipality) throw { message: "municipality Not found", statusCode: 404 };
  if (municipality.status !== "approved") throw { message: "municipality Not approved", statusCode: 403 };

  const isMatch = await comparePassword(password, municipality.password);
  if (!isMatch) throw { message: "Invalid password", statusCode: 401 };

  const otp = generateOtp();

  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt: new Date(Date.now() + 3 * 60 * 1000) });
  await sendOtpEmail(email, otp);

  return { message: `OTP sent to ${email}` };
};

exports.validateMunicipalityOtpService = async ({ email, otp }, io) => {
  const record = await Otp.findOne({ email, otp });
  if (!record) throw { message: "Invalid OTP", statusCode: 400 };
  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    throw { message: "OTP expired", statusCode: 400 };
  }

  await Otp.deleteMany({ email });
  const municipality = await Municipality.findOne({
    $or: [{ primaryEmail: email }, { secondaryEmail: email }]
  });
  const token = createToken({ id: municipality._id, email: municipality.primaryEmail, type: "municipality" });

  return { message: "OTP verified", token, municipality };
};

exports.sendMunicipalityOtpService = async ({ email }, io) => {
  const municipality = await Municipality.findOne({
    $or: [{ primaryEmail: email }, { secondaryEmail: email }]
  });
  if (!municipality) throw { message: "Not found", statusCode: 404 };

  const otp = generateOtp();
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt: new Date(Date.now() + 3 * 60 * 1000) });
  await sendOtpEmail(email, otp);

  return { message: `OTP resent to ${email}` };
};

exports.resetMunicipalityPasswordService = async ({ email, newPassword }, io, tokenHeader) => {
  const municipality = await Municipality.findOne({ primaryEmail: email });
  if (!municipality) throw { message: "Municipality Not found", statusCode: 404 };

  const isSame = await comparePassword(newPassword, municipality.password);
  if (isSame) throw { message: "Password same as before", statusCode: 400 };

  municipality.password = await hashPassword(newPassword);
  await municipality.save();

  const token = tokenHeader?.split(" ")[1];
  const decoded = verifyToken(token);
  await BlacklistedToken.create({
    token,
    expiresAt: new Date(decoded.exp * 1000)
  });

  return { message: "Password reset successfully" };
};

exports.getMunicipalityProfileService = async (id) => {
  const municipality = await Municipality.findById(id).select("-password").lean();
  if (!municipality) throw { message: "Not found", statusCode: 404 };
  return { municipality };
};

exports.logoutMunicipalityService = async (tokenHeader) => {
  const token = tokenHeader?.split(" ")[1];
  const decoded = verifyToken(token);
  await BlacklistedToken.create({ token, expiresAt: new Date(decoded.exp * 1000) });
  return { message: "Logged out successfully" };
};

exports.fetchMunicipalitiesService = async (query = {}) => {
  const {
    lat,
    lon,
    radius = 10000,
    city = '',
    status = '',
    page = 1,
    limit = 10
  } = query;

  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * pageSize;

  const hasLatLon = lat !== undefined && lon !== undefined;
  const hasOnlyOne = (lat && !lon) || (!lat && lon);

  if (hasOnlyOne) {
    throw {
      success: false,
      message: "Both latitude and longitude must be provided together.",
      statusCode: 400
    };
  }

  try {
    let municipalities = [];
    let totalCount = 0;

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
      // If no lat/lon, just return all municipalities with filters
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
    console.error('[ERROR] fetchMunicipalitiesService:', error);
    throw {
      success: false,
      message: "Failed to fetch municipalities.",
      statusCode: 500
    };
  }
};

exports.approveMunicipalityService = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw { message: "Invalid ID", statusCode: 400 };
  const muni = await Municipality.findById(id);
  if (!muni) throw { message: "Municipality Not found", statusCode: 404 };
  if (muni.status === "approved") throw { message: "Municipality Already approved", statusCode: 400 };

  muni.status = "approved";
  await muni.save();
  await sendMunicipalityApprovedEmail(muni.primaryEmail, muni.name);
  return { message: "Approved successfully", municipality: muni };
};

exports.rejectMunicipalityService = async (id, reason) => {
  if (!mongoose.isValidObjectId(id)) throw { message: "Invalid ID", statusCode: 400 };
  if (!reason) throw { message: "Reason required", statusCode: 400 };

  const muni = await Municipality.findById(id);
  if (!muni) throw { message: "Municipality Not found", statusCode: 404 };
  if (muni.status === "rejected") throw { message: "Municipality Already rejected", statusCode: 400 };

  muni.status = "rejected";
  await muni.save();
  await sendMunicipalityRejectEmail(muni.primaryEmail, muni.name, reason);
  return { message: "Rejected successfully", municipality: muni };
};

exports.updateMunicipalityProfileService = async (data, id) => {
  const { vehicle, resourceImages, manPower } = data;

  if (!mongoose.isValidObjectId(id)) throw { message: "Invalid ID", statusCode: 400 };

  const muni = await Municipality.findById(id);
  if (!muni) throw { message: "Not found", statusCode: 404 };
  if (muni.isProfileComplete) throw { message: "Profile already complete", statusCode: 400 };

  muni.vehicle = vehicle;
  muni.resourceImages = resourceImages;
  muni.manPower = {
    male: parseInt(manPower.male, 10),
    female: parseInt(manPower.female, 10)
  };
  muni.isProfileComplete = true;
  await muni.save();

  return { message: "Profile updated successfully", municipality: muni };
};
