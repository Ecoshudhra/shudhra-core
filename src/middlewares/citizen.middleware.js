const { body } = require('express-validator');

exports.validateCitizenRegister = [ //  ✔
  body('name').notEmpty().withMessage('Name is required'),
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('phone')
    .notEmpty().withMessage('Phone is required')
    .isMobilePhone('en-IN').withMessage('Invalid phone number'),
  body('password').notEmpty().withMessage("password is required").isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.validateCitizenLogin = [ //  ✔
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateCitizenOtpVerification = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('otp').notEmpty().withMessage('Otp is required'),
];

exports.validateCitizenSendOtpRequest = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
];

exports.validateCitizenResetPassword = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

exports.validateCitizenAddress = [
  body('coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array with [longitude, latitude]'),
  body('state').notEmpty().withMessage('State is required'),
  body('district').notEmpty().withMessage('District is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('pincode').notEmpty().withMessage('Pincode is required'),
];