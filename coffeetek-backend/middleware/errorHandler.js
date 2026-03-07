const AppError = require('../utils/AppError');

function errorHandler(err, _req, res, _next) {
    if (!(err instanceof AppError)) {
        console.error(err);
    }

    const status = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';

    res.status(status).json({
        success: false,
        code,
        message: err.message || 'Lỗi server',
    });
}

module.exports = errorHandler;

