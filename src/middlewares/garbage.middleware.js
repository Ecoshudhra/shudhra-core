const { body } = require("express-validator");

exports.validateGarbageReport = [
    body('garbageUrl').isURL().withMessage('Garbage image URL must be a valid URL.'),

    body('description')
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string.')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long.'),

    body('location')
        .notEmpty().withMessage('Location is required')
        .isObject().withMessage('Location must be an object.'),

    body('location.coordinates')
        .notEmpty().withMessage('Coordinates is required')
        .isArray({ min: 2, max: 2 }).withMessage('Invalid coordinates format'),
    body('location.coordinates[0]')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('location.coordinates[1]')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

    body('location.address')
        .notEmpty().withMessage('Address is required')
        .isString().withMessage('Address must be a string.'),

    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(['Organic', 'Inorganic', 'Mixed'])
        .withMessage('Type must be one of: Organic, Inorganic, Mixed.')
];

exports.validateGarbageStatusChange = [
    body('status')
        .notEmpty().withMessage('Status is required').bail()
        .isIn(['In Progress', 'Resolved']).bail()
        .withMessage('Type must be one of: In Progress, Resolved.')
]