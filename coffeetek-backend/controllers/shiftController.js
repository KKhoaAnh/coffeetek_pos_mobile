const db = require('../config/db');
const { sendShiftReport } = require('../services/emailService');

// Helper: Lấy thời gian hiện tại theo múi giờ Việt Nam

// ======================================================================
// 1. LẤY THÔNG TIN TÓM TẮT TRƯỚC KHI ĐÓNG CA (Preview)
// ======================================================================
exports.getShiftSummary = async (req, res) => {
    try {
        const { shiftId } = req.query;
        if (!shiftId) return res.status(400).json({ message: 'Thiếu shiftId' });

        const [shift] = await db.query("SELECT * FROM shifts WHERE shift_id = ?", [shiftId]);
        if (shift.length === 0) return res.status(404).json({ message: 'Không tìm thấy ca' });

        const currentShift = shift[0];

        // Tính tổng doanh thu TIỀN MẶT trong ca (dùng shift_id nếu có, fallback về thời gian)
        const sqlCashSales = `
            SELECT IFNULL(SUM(total_amount - IFNULL(discount_amount, 0)), 0) as cash_sales 
            FROM orders 
            WHERE status = 'COMPLETED' 
            AND payment_method = 'CASH'
            AND (shift_id = ? OR (shift_id IS NULL AND created_at >= ? AND created_at <= NOW()))
        `;

        // Tính tổng doanh thu CHUYỂN KHOẢN trong ca
        const sqlTransferSales = `
            SELECT IFNULL(SUM(total_amount - IFNULL(discount_amount, 0)), 0) as transfer_sales 
            FROM orders 
            WHERE status = 'COMPLETED' 
            AND payment_method != 'CASH'
            AND (shift_id = ? OR (shift_id IS NULL AND created_at >= ? AND created_at <= NOW()))
        `;

        // Tổng số đơn hoàn thành
        const sqlOrderCount = `
            SELECT COUNT(*) as total_orders
            FROM orders 
            WHERE status = 'COMPLETED' 
            AND (shift_id = ? OR (shift_id IS NULL AND created_at >= ? AND created_at <= NOW()))
        `;

        // Tổng số món bán
        const sqlItemCount = `
            SELECT IFNULL(SUM(od.quantity), 0) as total_items
            FROM order_details od
            JOIN orders o ON od.order_id = o.order_id
            WHERE o.status = 'COMPLETED'
            AND (o.shift_id = ? OR (o.shift_id IS NULL AND o.created_at >= ? AND o.created_at <= NOW()))
        `;

        const [cashResult] = await db.query(sqlCashSales, [shiftId, currentShift.start_time]);
        const [transferResult] = await db.query(sqlTransferSales, [shiftId, currentShift.start_time]);
        const [orderResult] = await db.query(sqlOrderCount, [shiftId, currentShift.start_time]);
        const [itemResult] = await db.query(sqlItemCount, [shiftId, currentShift.start_time]);

        const totalCashSales = parseFloat(cashResult[0].cash_sales) || 0;
        const totalTransferSales = parseFloat(transferResult[0].transfer_sales) || 0;
        const initialFloat = parseFloat(currentShift.initial_float) || 0;
        const expectedCash = initialFloat + totalCashSales;
        const totalOrders = parseInt(orderResult[0].total_orders) || 0;
        const totalItems = parseInt(itemResult[0].total_items) || 0;

        res.status(200).json({
            initial_float: initialFloat,
            total_cash_sales: totalCashSales,
            total_transfer_sales: totalTransferSales,
            total_all_sales: totalCashSales + totalTransferSales,
            expected_cash: expectedCash,
            total_orders: totalOrders,
            total_items_sold: totalItems
        });

    } catch (error) {
        console.error("Lỗi summary:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ======================================================================
// 2. LẤY DANH SÁCH CA TRONG NGÀY
// ======================================================================
exports.getTodayShifts = async (req, res) => {
    try {
        const userId = req.query.userId;
        const sql = `
            SELECT s.*, u.full_name as user_name
            FROM shifts s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.user_id = ? 
            AND DATE(s.start_time) = CURDATE() 
            ORDER BY s.start_time DESC
        `;

        const [rows] = await db.query(sql, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách ca:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ======================================================================
// 3. MỞ CA MỚI
// ======================================================================
exports.openShift = async (req, res) => {
    try {
        const { user_id, initial_float, note } = req.body;

        // Kiểm tra xem đã có ca mở chưa
        const checkSql = "SELECT shift_id FROM shifts WHERE user_id = ? AND status = 'OPEN'";
        const [existing] = await db.query(checkSql, [user_id]);

        if (existing.length > 0) return res.status(400).json({ message: 'Bạn đang có một ca chưa đóng!' });

        const sql = `
            INSERT INTO shifts (user_id, initial_float, start_time, status, note) 
            VALUES (?, ?, NOW(), 'OPEN', ?)
        `;

        const [result] = await db.query(sql, [user_id, initial_float, note || '']);

        res.status(201).json({
            message: 'Mở ca thành công',
            shift_id: result.insertId
        });

    } catch (error) {
        console.error("Lỗi mở ca:", error);
        res.status(500).json({ message: 'Lỗi server khi mở ca' });
    }
};

// ======================================================================
// 4. ĐÓNG CA + TẠO BÁO CÁO CHI TIẾT + GỬI EMAIL
// ======================================================================
exports.closeShift = async (req, res) => {
    try {
        const { shift_id, actual_cash, note, send_email, email_to } = req.body;

        // --- Bước 1: Lấy thông tin ca ---
        const [shift] = await db.query("SELECT * FROM shifts WHERE shift_id = ?", [shift_id]);
        if (shift.length === 0) return res.status(404).json({ message: 'Ca không tồn tại' });
        const currentShift = shift[0];

        // Lấy tên nhân viên
        const [userRows] = await db.query("SELECT full_name FROM users WHERE user_id = ?", [currentShift.user_id]);
        const userName = userRows.length > 0 ? userRows[0].full_name : 'Nhân viên';

        // --- Bước 2: Tính toán doanh thu trong ca (dùng shift_id) ---
        // Condition cho query trực tiếp bảng orders
        const shiftCondition = `(shift_id = ? OR (shift_id IS NULL AND created_at >= ?))`;
        // Condition cho query join (cần prefix o.)
        const shiftConditionAliased = `(o.shift_id = ? OR (o.shift_id IS NULL AND o.created_at >= ?))`;

        // Doanh thu tiền mặt
        const [cashSales] = await db.query(
            `SELECT IFNULL(SUM(total_amount - IFNULL(discount_amount, 0)), 0) as amount 
             FROM orders WHERE status = 'COMPLETED' AND payment_method = 'CASH' AND ${shiftCondition}`,
            [shift_id, currentShift.start_time]
        );

        // Doanh thu chuyển khoản
        const [transferSales] = await db.query(
            `SELECT IFNULL(SUM(total_amount - IFNULL(discount_amount, 0)), 0) as amount 
             FROM orders WHERE status = 'COMPLETED' AND payment_method != 'CASH' AND ${shiftCondition}`,
            [shift_id, currentShift.start_time]
        );

        // Tổng số đơn
        const [orderCount] = await db.query(
            `SELECT COUNT(*) as cnt FROM orders WHERE status = 'COMPLETED' AND ${shiftCondition}`,
            [shift_id, currentShift.start_time]
        );

        // Tổng số món bán
        const [itemCount] = await db.query(
            `SELECT IFNULL(SUM(od.quantity), 0) as cnt
             FROM order_details od
             JOIN orders o ON od.order_id = o.order_id
             WHERE o.status = 'COMPLETED' AND ${shiftConditionAliased}`,
            [shift_id, currentShift.start_time]
        );

        // Top 10 món bán chạy trong ca
        const [topProducts] = await db.query(
            `SELECT 
                p.product_name,
                SUM(od.quantity) as total_quantity,
                SUM(od.total_line_amount) as total_revenue
             FROM order_details od
             JOIN orders o ON od.order_id = o.order_id
             JOIN products p ON od.product_id = p.product_id
             WHERE o.status = 'COMPLETED' AND ${shiftConditionAliased}
             GROUP BY od.product_id, p.product_name
             ORDER BY total_quantity DESC
             LIMIT 10`,
            [shift_id, currentShift.start_time]
        );

        // --- Bước 3: Tính toán ---
        const totalCashSales = parseFloat(cashSales[0].amount) || 0;
        const totalTransferSales = parseFloat(transferSales[0].amount) || 0;
        const totalAllSales = totalCashSales + totalTransferSales;
        const initialFloat = parseFloat(currentShift.initial_float) || 0;
        const expectedCash = initialFloat + totalCashSales;
        const difference = actual_cash - expectedCash;
        const totalOrders = parseInt(orderCount[0].cnt) || 0;
        const totalItemsSold = parseInt(itemCount[0].cnt) || 0;

        // --- Bước 4: Cập nhật DB ---
        const closeNote = note ? `[Đóng ca]: ${note}` : '';
        const finalNote = currentShift.note ? `${currentShift.note} | ${closeNote}` : closeNote;

        const sqlUpdate = `
            UPDATE shifts 
            SET status = 'CLOSED', 
                end_time = NOW(),
                total_sales = ?,
                total_cash_sales = ?,
                expected_cash = ?,
                actual_cash = ?,
                difference = ?,
                note = ?
            WHERE shift_id = ?
        `;

        await db.query(sqlUpdate, [
            totalAllSales, totalCashSales, expectedCash, actual_cash, difference, finalNote, shift_id
        ]);

        // --- Bước 5: Chuẩn bị data response và email ---
        const endTime = new Date();

        const reportData = {
            shift_id,
            user_name: userName,
            start_time: currentShift.start_time,
            end_time: endTime,
            initial_float: initialFloat,
            total_cash_sales: totalCashSales,
            total_transfer_sales: totalTransferSales,
            total_all_sales: totalAllSales,
            expected_cash: expectedCash,
            actual_cash: actual_cash,
            difference: difference,
            total_orders: totalOrders,
            total_completed_orders: totalOrders,
            total_items_sold: totalItemsSold,
            top_products: topProducts,
            note: finalNote
        };

        // --- Bước 6: Gửi email (async, không block response) ---
        if (send_email !== false) {
            // Gửi email trong background, không cần chờ
            sendShiftReport(reportData, email_to)
                .then(success => {
                    if (success) console.log(`[Shift ${shift_id}] Email báo cáo đã gửi thành công`);
                })
                .catch(err => {
                    console.error(`[Shift ${shift_id}] Gửi email thất bại:`, err.message);
                });
        }

        // --- Bước 7: Trả response ---
        res.status(200).json({
            message: 'Đóng ca thành công',
            data: reportData
        });

    } catch (error) {
        console.error("Lỗi đóng ca:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ======================================================================
// 5. [MỚI] LẤY BÁO CÁO CHI TIẾT CỦA MỘT CA (Xem lại lịch sử)
// ======================================================================
exports.getShiftReport = async (req, res) => {
    try {
        const shiftId = req.params.id;

        // Lấy thông tin ca + nhân viên
        const [shiftRows] = await db.query(`
            SELECT s.*, u.full_name as user_name
            FROM shifts s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.shift_id = ?
        `, [shiftId]);

        if (shiftRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy ca' });
        const shiftData = shiftRows[0];

        const shiftCondition = `(o.shift_id = ? OR (o.shift_id IS NULL AND o.created_at >= ? AND o.created_at <= ?))`;
        const endTime = shiftData.end_time || new Date();

        // Danh sách đơn hàng trong ca
        const [orders] = await db.query(`
            SELECT o.order_id, o.order_code, o.total_amount, o.discount_amount, 
                   o.payment_method, o.status, o.created_at, o.completed_at,
                   t.table_name
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.table_id
            WHERE o.status = 'COMPLETED' AND ${shiftCondition}
            ORDER BY o.completed_at ASC
        `, [shiftId, shiftData.start_time, endTime]);

        // Top món bán
        const [topProducts] = await db.query(`
            SELECT 
                p.product_name,
                c.category_name,
                SUM(od.quantity) as total_quantity,
                SUM(od.total_line_amount) as total_revenue
            FROM order_details od
            JOIN orders o ON od.order_id = o.order_id
            JOIN products p ON od.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            WHERE o.status = 'COMPLETED' AND ${shiftCondition}
            GROUP BY od.product_id, p.product_name, c.category_name
            ORDER BY total_quantity DESC
            LIMIT 15
        `, [shiftId, shiftData.start_time, endTime]);

        res.status(200).json({
            shift: shiftData,
            orders: orders,
            top_products: topProducts,
            summary: {
                total_orders: orders.length,
                total_cash_sales: parseFloat(shiftData.total_cash_sales) || 0,
                total_all_sales: parseFloat(shiftData.total_sales) || 0,
                initial_float: parseFloat(shiftData.initial_float) || 0,
                expected_cash: parseFloat(shiftData.expected_cash) || 0,
                actual_cash: parseFloat(shiftData.actual_cash) || 0,
                difference: parseFloat(shiftData.difference) || 0
            }
        });

    } catch (error) {
        console.error("Lỗi lấy báo cáo ca:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};