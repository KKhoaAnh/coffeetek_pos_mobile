const db = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/** Kiểm tra PIN trùng (so sánh với hash hoặc plain cũ) */
async function isPinMatch(plainPin, storedPin) {
    if (!storedPin) return false;
    if (/^\$2[aby]\$\d+\$/.test(storedPin)) {
        return bcrypt.compare(plainPin, storedPin);
    }
    return plainPin === storedPin;
}

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT user_id, username, full_name, role, is_active, created_at, avatar_url FROM users ORDER BY role, full_name'
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách nhân viên' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, full_name, role, pin_code } = req.body;

        if (!full_name || !pin_code) {
            return res.status(400).json({ message: 'Tên và mã PIN là bắt buộc' });
        }

        const pinStr = String(pin_code).trim();
        const [existing] = await db.query('SELECT user_id, pin_code FROM users');
        for (const row of existing) {
            const match = await isPinMatch(pinStr, row.pin_code);
            if (match) {
                return res.status(400).json({ message: 'Mã PIN này đã được sử dụng!' });
            }
        }

        const pinHash = await bcrypt.hash(pinStr, SALT_ROUNDS);
        const sql = `INSERT INTO users (username, full_name, role, pin_code, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())`;
        await db.query(sql, [username || full_name, full_name, role || 'STAFF', pinHash]);

        res.status(201).json({ message: 'Thêm nhân viên thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thêm nhân viên' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { full_name, role, pin_code } = req.body;

        let pinValue = null;
        if (pin_code !== undefined && pin_code !== null && String(pin_code).trim() !== '') {
            pinValue = await bcrypt.hash(String(pin_code).trim(), SALT_ROUNDS);
        }

        if (pinValue !== null) {
            await db.query(
                'UPDATE users SET full_name = ?, role = ?, pin_code = ? WHERE user_id = ?',
                [full_name, role, pinValue, userId]
            );
        } else {
            await db.query(
                'UPDATE users SET full_name = ?, role = ? WHERE user_id = ?',
                [full_name, role, userId]
            );
        }

        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật nhân viên' });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { is_active } = req.body;

        let sql;
        let params;

        if (is_active) {
            sql = 'UPDATE users SET is_active = 1, created_at = NOW() WHERE user_id = ?';
            params = [userId];
        } else {
            sql = 'UPDATE users SET is_active = 0 WHERE user_id = ?';
            params = [userId];
        }

        await db.query(sql, params);

        res.status(200).json({
            message: is_active ? 'Đã kích hoạt và làm mới ngày vào làm' : 'Đã khóa tài khoản',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
    }
};
