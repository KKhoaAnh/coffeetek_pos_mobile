const Joi = require('joi');
const AppError = require('../utils/AppError');

const validateBody = (schema) => (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const details = error.details.map((d) => d.message).join('; ');
        return next(new AppError(400, `Dữ liệu không hợp lệ: ${details}`, 'VALIDATION_ERROR'));
    }

    req.body = value;
    next();
};

module.exports = { Joi, validateBody };

