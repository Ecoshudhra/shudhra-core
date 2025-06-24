const { body, check, validationResult, oneOf } = require('express-validator');

const VEHICLE_TYPES = [
  'Tippers', 'Dumper Placers', 'Refuse Compactors', 'Hopper Tippers',
  'Mini Garbage Vans', 'Auto Tippers', 'Battery-Operated Rickshaw Tippers',
  'Pushcarts', 'Tricycles with Bins', 'Hook Loaders', 'Covered Bin Tippers',
  'Compactor with Partition', 'Electric Garbage Vans'
];
const MUNICIPALITY_TYPE = ['Municipal Corporation', 'Municipal Council', 'Nagar Panchayat'];

exports.validateMunicipalityRequest = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email'),
  body('phone')
    .notEmpty().withMessage('Phone is required')
    .isMobilePhone('en-IN').withMessage('Invalid phone number'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('type')
    .notEmpty().withMessage('Municipality type is required')
    .isIn(MUNICIPALITY_TYPE).withMessage('Invalid municipality type'),
  body('ulbCode')
    .notEmpty().withMessage('ULB code is required')
    .matches(/^[A-Z]{2}[0-9]{4}$/).withMessage('ULB code must be like WB1234'),
  body().custom((value, { req }) => {
    if (!req.body.registrationNumber && !req.body.govCertificateUrl) {
      throw new Error('At least registration number or government certificate URL must be provided');
    }
    if (req.body.govCertificateUrl) {
      const regex = /^https?:\/\/.+$/;
      if (!regex.test(req.body.govCertificateUrl)) {
        throw new Error('Invalid government certificate URL');
      }
    }
    return true;
  }),

  body('location')
    .notEmpty().withMessage('Location is required')
    .isObject().withMessage('Location must be an object.'),
  body('location.zone').notEmpty().withMessage('Zone is required'),
  body('location.coordinates').notEmpty().withMessage('Coordinates is required').isArray({ min: 2, max: 2 }).withMessage('Invalid coordinates format'),
  body('location.coordinates[0]')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location.coordinates[1]')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('location.district').notEmpty().withMessage('District is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.pincode').notEmpty().withMessage('Pincode is required').isPostalCode('IN').withMessage('Invalid pincode'),
  body('location.wardNumber').notEmpty().withMessage('Ward Number is required'),
];

exports.validateMunicipalityLogin = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateMunicipalityOtpVerification = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('otp').notEmpty().withMessage('Otp is required'),
];

exports.validateMunicipalitySendOtpRequest = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
];

exports.validateMunicipalityPassword = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

exports.validateMunicipalityProfileUpdate = [
  body('vehicle').isArray({ min: 1 }).withMessage('At least one vehicle is required.').isIn(VEHICLE_TYPES).withMessage('Invalid vehicle type'),

  body('resourceImages').isArray({ min: 2 }).withMessage('At least two images are required').custom((images) => {
    const cloudinaryDomain = 'cloudinary.com';
    const urlRegex = /^https?:\/\/.+$/;
    for (const url of images) {
      if (typeof url !== 'string') {
        throw new Error('Each image must be a string URL.');
      }
      if (!urlRegex.test(url)) {
        throw new Error('Each image must be a valid URL.');
      }
      if (!url.includes(cloudinaryDomain)) {
        throw new Error('Images must be hosted on Cloudinary.');
      }
    }
    return true; // all images are valid
  }),

  body('manPower.male')
    .isInt({ min: 0 }).withMessage('Male manpower must be ≥ 0'),

  body('manPower.female')
    .isInt({ min: 0 }).withMessage('Female manpower must be ≥ 0'),

  body(['manPower.male', 'manPower.female']).custom((_, { req }) => {
    console.log(_);

    const male = parseInt(req.body.manPower?.male || 0);
    const female = parseInt(req.body.manPower?.female || 0);
    if (male + female <= 0) {
      throw new Error('Total manpower (male + female) must be > 0.');
    }
    return true;
  }),
];
