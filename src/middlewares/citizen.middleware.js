const { body } = require('express-validator');

exports.validateCitizenRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('phone')
    .notEmpty().withMessage('Phone is required')
    .isMobilePhone('en-IN').withMessage('Invalid phone number'),
  body('password').notEmpty().withMessage("password is required").isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.validateCitizenLogin = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateCitizenLoginWithOTP = [
  body('email').notEmpty().withMessage("Email is required").isEmail().withMessage('Invalid email'),
  body('otp').notEmpty().withMessage('Otp is required'),
];
