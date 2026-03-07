class AppError extends Error {
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || 'UNKNOWN_ERROR';
    }
}

module.exports = AppError;

