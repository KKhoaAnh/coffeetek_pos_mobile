const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/** Kiểm tra PIN trùng với bản lưu (hash hoặc plain-text cũ) */
async function isPinMatch(plainPin, storedPin) {
    if (!storedPin) return false;
    // Đã hash bằng bcrypt (định dạng $2a$, $2b$, $2y$)
    if (/^\$2[aby]\$\d+\$/.test(storedPin)) {
        return bcrypt.compare(plainPin, storedPin);
    }
    return plainPin === storedPin;
}

exports.loginWithPin = async (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        return res.status(400).json({ message: 'Vui lòng nhập mã PIN' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim() === '') {
        console.error('JWT_SECRET chưa được cấu hình trong .env');
        return res.status(500).json({ message: 'Server chưa cấu hình bảo mật' });
    }

    try {
        const [rows] = await db.query(
            'SELECT user_id, full_name, role, avatar_url, pin_code FROM users WHERE is_active = 1'
        );

        let user = null;
        for (const row of rows) {
            const match = await isPinMatch(String(pin), row.pin_code);
            if (match) {
                user = row;
                break;
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Mã PIN không đúng hoặc tài khoản bị khóa' });
        }

        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            secret,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
