const GarbageReport = require("../models/GarbageReport.model");
const Municipality = require("../models/Municipality.model");
const Citizen = require("../models/Citizen.model");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const sendNotification = require("../utils/sendNotification");

exports.createGarbageReport = async (reportedBy, req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    if (!mongoose.Types.ObjectId.isValid(reportedBy)) {
        throw { message: "Invalid citizen id", statusCode: 400 };
    }

    const citizen = await Citizen.findById(reportedBy);
    if (!citizen) {
        throw { message: "Citizen not found", statusCode: 404 };
    }

    if (citizen.todaysReportCount >= citizen.allowedReportPerDay) {
        throw {
            message: `Report limit reached. Only ${citizen.allowedReportPerDay} reports allowed per day.`,
            statusCode: 429
        };
    }

    const {
        garbageUrl,
        description,
        location: {
            coordinates: [lon, lat],
            address,
        },
        type
    } = req.body;

    if (isNaN(lon) || isNaN(lat)) {
        throw { statusCode: 400, message: 'Invalid coordinates provided.' };
    }

    const nearestMunicipalityData = await Municipality.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lon, lat] },
                distanceField: "distance",
                spherical: true,
                // maxDistance: process.env.MAX_DISTANCE_TO_FIND_MUNICIPALITY || 20000, // 20 km
                query: { status: "approved" }
            }
        },
        { $limit: 1 }
    ]);

    if (!nearestMunicipalityData || nearestMunicipalityData.length === 0) {
        throw { statusCode: 404, message: 'No municipality found near this location.' };
    }

    const nearestMunicipality = nearestMunicipalityData[0];

    const newGarbage = await GarbageReport.create({
        reportedBy,
        garbageUrl,
        assignedToMunicipality: nearestMunicipality._id,
        description,
        location: {
            type: 'Point',
            coordinates: [Number(parseFloat(lon)), Number(parseFloat(lat))],
            address
        },
        type,
        status: 'Pending',
    });

    await Promise.all([
        Municipality.updateOne(
            { _id: nearestMunicipality._id },
            { $push: { assignedGarbageReports: newGarbage._id } }
        ),
        Citizen.updateOne(
            { _id: reportedBy },
            { $push: { garbageReports: newGarbage._id }, $inc: { todaysReportCount: 1 } }
        )
    ]);

    // Send notification to garbage collector
    await sendNotification({
        io,
        receiverId: nearestMunicipality._id,
        receiverType: 'Municipality',
        message: "A new garbage report has been submitted in your area. Please review and take necessary action.",
        link: `/admin/municipality/`
    });

    // send notification to admin
    await sendNotification({
        io,
        receiverId: null,
        receiverType: 'Admin',
        message: `Citizen submitted a garbage report near ${address}. Assigned to ${nearestMunicipality.name}.`,
        link: `/admin/reports`
    });


    return {
        message: `Garbage report submitted successfully to ${nearestMunicipality.name} (${nearestMunicipality.distance.toFixed(2)} meters away).`,
        data: newGarbage
    };
};

exports.GarbageByCitizen = async (citizenId, query) => {
    const filter = { reportedBy: citizenId };

    if (query.status && query.status !== 'All') {
        filter.status = query.status;
    }

    if (query.type && query.type !== 'All') {
        filter.type = query.type;
    }

    const sortOrder = query.sort === '1' ? 1 : -1;

    const reports = await GarbageReport.find(filter)
        .sort({ createdAt: sortOrder })
        .populate('assignedToMunicipality', 'name');

    return reports;
};


exports.AllGarbage = async (query) => {
    const filter = {};
    if (query.status && query.status !== 'All') {
        filter.status = query.status;
    }

    if (query.type && query.type !== 'All') {
        filter.type = query.type;
    }
    const sortOrder = query.sort === '1' ? 1 : -1;

    const reports = await GarbageReport.find(filter)
        .sort({ createdAt: sortOrder })
        .populate('assignedToMunicipality', 'name')
        .populate('reportedBy', 'name phone email avatar')

    return reports;
};

exports.GarbageByMunicipality = async (municipalityId, query) => {
    const filter = { assignedToMunicipality: municipalityId };
    if (query.status && query.status !== 'All') {
        filter.status = query.status;
    }

    if (query.type && query.type !== 'All') {
        filter.type = query.type;
    }

    const sortOrder = query.sort === '1' ? 1 : -1;

    const reports = await GarbageReport.find(filter)
        .sort({ createdAt: sortOrder })
        .populate('assignedToMunicipality', 'name');

    return reports;
};

exports.garbageById = async (id) => {
    return await GarbageReport.findById(id)
        .populate('reportedBy')
        .populate('assignedToMunicipality');
};

exports.updateGarbageStatusService = async (garbageId, status, req, io) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw { message: errors.array()[0].msg, statusCode: 422 };
    }

    if (!mongoose.Types.ObjectId.isValid(garbageId)) {
        throw { message: "Invalid Municipality ID", statusCode: 400 };
    }


    const ALLOWED_TRANSITIONS = {
        'Pending': 'In Progress',
        'In Progress': 'Resolved',
    };

    const VALID_TARGET_STATUSES = Object.values(ALLOWED_TRANSITIONS);

    if (!VALID_TARGET_STATUSES.includes(status)) {
        throw {
            statusCode: 400,
            message: `Invalid status. Allowed transitions: Pending → In Progress → Resolved.`,
        };
    }

    const garbageReport = await GarbageReport.findById(garbageId);

    if (!garbageReport) {
        throw { statusCode: 404, message: 'Garbage report not found.' };
    }

    if (garbageReport.status === "Resolved") {
        throw { statusCode: 400, message: "Garbage report is already resolved." };
    }

    const currentStatus = garbageReport.status;
    const allowedNextStatus = ALLOWED_TRANSITIONS[currentStatus];

    if (status !== allowedNextStatus) {
        throw {
            statusCode: 400,
            message: `Invalid status transition from '${currentStatus}' to '${status}'. Allowed: '${allowedNextStatus}'`,
        };
    }

    garbageReport.status = status;
    await garbageReport.save();

    if (status === 'Resolved') {
        let citizen = await Citizen.findById(garbageReport.reportedBy);
        citizen.ecoCrystals.totalEarned += citizen.ecoCrystals.rewardPerReport;
        await citizen.save();

        await sendNotification({
            io,
            receiverId: citizen._id,
            receiverType: 'Citizen',
            message: `Your garbage report at ${garbageReport.location.address} has been resolved. You've earned ${citizen.ecoCrystals.rewardPerReport} EcoCrystals!`,
            link: `/citizen/reports/${garbageReport._id}`
        });

        // Optional: notify admin
        await sendNotification({
            io,
            receiverId: null,
            receiverType: 'Admin',
            message: `Garbage report at ${garbageReport.location.address} was resolved by municipality.`,
            link: `/admin/reports`
        });
    }

    return {
        message: `Status updated to '${status}' successfully.`,
        data: garbageReport
    };
};
