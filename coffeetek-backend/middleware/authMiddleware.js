const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT.
 * Đọc header Authorization: Bearer <token>, verify và gắn req.user = { id, role }.
 * Không dùng fallback secret → bắt buộc cấu hình JWT_SECRET trong .env.
 */
function authMiddleware(req, res, next) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim() === '') {
        console.error('JWT_SECRET chưa được cấu hình trong .env');
        return res.status(500).json({ message: 'Server chưa cấu hình bảo mật' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Thiếu hoặc sai định dạng token' });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, secret);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token hết hạn, vui lòng đăng nhập lại' });
        }
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
}

module.exports = authMiddleware;
