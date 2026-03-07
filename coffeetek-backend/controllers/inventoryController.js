const db = require('../config/db');

// ======================================================================
// HELPERS
// ======================================================================

const mapRow = (row) => ({
    item_id: row.item_id,
    item_name: row.item_name,
    unit: row.unit,
    import_unit: row.import_unit || null,
    conversion_factor: Number(row.conversion_factor || 1),
    min_stock_level: Number(row.min_stock_level || 0),
    linked_product_id: row.linked_product_id || null,
    linked_product_name: row.product_name || null,
    quantity: Number(row.quantity || 0),
    is_low_stock: Number(row.quantity || 0) <= Number(row.min_stock_level || 0) && Number(row.min_stock_level || 0) > 0,
    is_active: row.is_active === 1 || row.is_active === true,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const mapTransaction = (row) => ({
    transaction_id: row.transaction_id,
    item_id: row.item_id,
    item_name: row.item_name,
    type: row.type,
    quantity: Number(row.quantity || 0),
    import_unit: row.import_unit,
    import_quantity: row.import_quantity ? Number(row.import_quantity) : null,
    stock_after: Number(row.stock_after || 0),
    reference_order_id: row.reference_order_id,
    created_by_user_id: row.created_by_user_id,
    user_name: row.full_name || null,
    note: row.note,
    created_at: row.created_at,
});

// SQL chung cho danh sách có JOIN products
const LIST_SQL_BASE = `
    SELECT i.item_id, i.item_name, i.unit, i.import_unit, i.conversion_factor,
           i.min_stock_level, i.linked_product_id, i.quantity, i.is_active,
           i.created_at, i.updated_at, p.product_name
    FROM inventory_items i
    LEFT JOIN products p ON i.linked_product_id = p.product_id
`;

// SQL cho lấy 1 item theo ID
const ITEM_BY_ID_SQL = `
    SELECT i.item_id, i.item_name, i.unit, i.import_unit, i.conversion_factor,
           i.min_stock_level, i.linked_product_id, i.quantity, i.is_active,
           i.created_at, i.updated_at, p.product_name
    FROM inventory_items i
    LEFT JOIN products p ON i.linked_product_id = p.product_id
    WHERE i.item_id = ?
`;

// ======================================================================
// 1. GET /api/inventory - Danh sách tất cả mặt hàng
// ======================================================================
exports.getInventoryItems = async (req, res) => {
    try {
        const onlyActive = req.query.activeOnly === '1' || req.query.activeOnly === 'true';
        const sql = `${LIST_SQL_BASE}
            ${onlyActive ? 'WHERE i.is_active = 1' : ''}
            ORDER BY 
                CASE WHEN i.quantity <= i.min_stock_level AND i.min_stock_level > 0 THEN 0 ELSE 1 END,
                i.item_name ASC
        `;
        const [rows] = await db.query(sql);
        res.status(200).json(rows.map(mapRow));
    } catch (error) {
        console.error('Lỗi getInventoryItems:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách kho' });
    }
};

// ======================================================================
// 2. GET /api/inventory/low-stock - Danh sách hàng sắp hết
// ======================================================================
exports.getLowStockItems = async (req, res) => {
    try {
        const sql = `${LIST_SQL_BASE}
            WHERE i.is_active = 1 
            AND i.min_stock_level > 0 
            AND i.quantity <= i.min_stock_level
            ORDER BY (i.quantity / i.min_stock_level) ASC
        `;
        const [rows] = await db.query(sql);
        res.status(200).json(rows.map(mapRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách cảnh báo' });
    }
};

// ======================================================================
// 3. POST /api/inventory - Tạo mặt hàng mới
// ======================================================================
exports.createInventoryItem = async (req, res) => {
    try {
        const { item_name, unit, import_unit, conversion_factor,
            min_stock_level, linked_product_id, quantity, is_active } = req.body;

        if (!item_name || !unit) {
            return res.status(400).json({ message: 'Thiếu tên hoặc đơn vị' });
        }

        const nameTrim = String(item_name).trim();

        // Chặn trùng tên
        const [dup] = await db.query(
            'SELECT item_id FROM inventory_items WHERE LOWER(item_name) = LOWER(?) LIMIT 1',
            [nameTrim]
        );
        if (dup && dup.length > 0) {
            return res.status(409).json({ message: 'Mặt hàng đã tồn tại' });
        }

        const qty = Math.max(0, Number(quantity || 0));

        const [result] = await db.query(
            `INSERT INTO inventory_items 
            (item_name, unit, import_unit, conversion_factor, min_stock_level, linked_product_id, quantity, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nameTrim, unit,
                import_unit || null,
                Math.max(1, Number(conversion_factor || 1)),
                Math.max(0, Number(min_stock_level || 0)),
                linked_product_id || null,
                qty,
                is_active === false ? 0 : 1
            ]
        );

        // Ghi nhận giao dịch nhập ban đầu (nếu có số lượng)
        if (qty > 0) {
            await db.query(
                `INSERT INTO inventory_transactions (item_id, type, quantity, stock_after, note)
                 VALUES (?, 'IMPORT', ?, ?, 'Khởi tạo kho')`,
                [result.insertId, qty, qty]
            );
        }

        const [rows] = await db.query(
            `SELECT i.*, p.product_name FROM inventory_items i
             LEFT JOIN products p ON i.linked_product_id = p.product_id
             WHERE i.item_id = ?`, [result.insertId]
        );

        res.status(201).json(mapRow(rows[0]));
    } catch (error) {
        console.error('Lỗi createInventoryItem:', error);
        res.status(500).json({ message: 'Lỗi tạo mặt hàng' });
    }
};

// ======================================================================
// 4. PUT /api/inventory/:id - Cập nhật thông tin mặt hàng
// ======================================================================
exports.updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, unit, import_unit, conversion_factor,
            min_stock_level, linked_product_id, is_active } = req.body;

        if (!item_name || !unit) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        const nameTrim = String(item_name).trim();

        await db.query(
            `UPDATE inventory_items SET 
                item_name = ?, unit = ?, import_unit = ?, conversion_factor = ?,
                min_stock_level = ?, linked_product_id = ?, is_active = ?
            WHERE item_id = ?`,
            [
                nameTrim, unit,
                import_unit || null,
                Math.max(1, Number(conversion_factor || 1)),
                Math.max(0, Number(min_stock_level || 0)),
                linked_product_id || null,
                is_active === false ? 0 : 1,
                id
            ]
        );

        const [rows] = await db.query(
            `SELECT i.*, p.product_name FROM inventory_items i
             LEFT JOIN products p ON i.linked_product_id = p.product_id
             WHERE i.item_id = ?`, [id]
        );
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mặt hàng' });
        }

        res.status(200).json(mapRow(rows[0]));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật mặt hàng' });
    }
};

// ======================================================================
// 5. POST /api/inventory/:id/import - NHẬP KHO (có quy đổi đơn vị)
// ======================================================================
exports.importStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, use_import_unit, note, user_id } = req.body;

        const inputQty = Number(quantity || 0);
        if (inputQty <= 0) {
            return res.status(400).json({ message: 'Số lượng phải > 0' });
        }

        // Lấy thông tin item
        const [itemRows] = await db.query('SELECT * FROM inventory_items WHERE item_id = ?', [id]);
        if (itemRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });

        const item = itemRows[0];
        const factor = Number(item.conversion_factor || 1);

        // Tính số lượng thực tế (đơn vị cơ bản)
        let actualQty = inputQty;
        let importUnit = null;
        let importQuantity = null;

        if (use_import_unit && item.import_unit && factor > 1) {
            // Nhập theo đơn vị lớn → quy đổi
            actualQty = inputQty * factor;
            importUnit = item.import_unit;
            importQuantity = inputQty;
        }

        // Cộng vào kho
        await db.query(
            'UPDATE inventory_items SET quantity = quantity + ? WHERE item_id = ?',
            [actualQty, id]
        );

        // Lấy tồn sau
        const [after] = await db.query('SELECT quantity FROM inventory_items WHERE item_id = ?', [id]);
        const stockAfter = Number(after[0].quantity);

        // Ghi lịch sử
        await db.query(
            `INSERT INTO inventory_transactions 
            (item_id, type, quantity, import_unit, import_quantity, stock_after, created_by_user_id, note)
            VALUES (?, 'IMPORT', ?, ?, ?, ?, ?, ?)`,
            [id, actualQty, importUnit, importQuantity, stockAfter, user_id || null, note || null]
        );

        const [rows] = await db.query(
            `SELECT i.*, p.product_name FROM inventory_items i
             LEFT JOIN products p ON i.linked_product_id = p.product_id
             WHERE i.item_id = ?`, [id]
        );

        res.status(200).json({
            message: importUnit
                ? `Đã nhập ${importQuantity} ${importUnit} (= ${actualQty} ${item.unit})`
                : `Đã nhập ${actualQty} ${item.unit}`,
            item: mapRow(rows[0])
        });
    } catch (error) {
        console.error('Lỗi importStock:', error);
        res.status(500).json({ message: 'Lỗi nhập kho' });
    }
};

// ======================================================================
// 6. POST /api/inventory/:id/export - XUẤT KHO THỦ CÔNG
// ======================================================================
exports.exportStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, note, user_id } = req.body;

        const exportQty = Number(quantity || 0);
        if (exportQty <= 0) {
            return res.status(400).json({ message: 'Số lượng phải > 0' });
        }

        // Kiểm tra tồn kho đủ không
        const [itemRows] = await db.query('SELECT * FROM inventory_items WHERE item_id = ?', [id]);
        if (itemRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });

        const item = itemRows[0];
        if (Number(item.quantity) < exportQty) {
            return res.status(400).json({
                message: `Không đủ tồn kho. Hiện có: ${item.quantity} ${item.unit}`
            });
        }

        // Trừ kho
        await db.query(
            'UPDATE inventory_items SET quantity = GREATEST(0, quantity - ?) WHERE item_id = ?',
            [exportQty, id]
        );

        const [after] = await db.query('SELECT quantity FROM inventory_items WHERE item_id = ?', [id]);
        const stockAfter = Number(after[0].quantity);

        // Ghi lịch sử
        await db.query(
            `INSERT INTO inventory_transactions 
            (item_id, type, quantity, stock_after, created_by_user_id, note)
            VALUES (?, 'EXPORT_MANUAL', ?, ?, ?, ?)`,
            [id, exportQty, stockAfter, user_id || null, note || 'Xuất kho thủ công']
        );

        const [rows] = await db.query(
            `SELECT i.*, p.product_name FROM inventory_items i
             LEFT JOIN products p ON i.linked_product_id = p.product_id
             WHERE i.item_id = ?`, [id]
        );

        res.status(200).json({
            message: `Đã xuất ${exportQty} ${item.unit}`,
            item: mapRow(rows[0])
        });
    } catch (error) {
        console.error('Lỗi exportStock:', error);
        res.status(500).json({ message: 'Lỗi xuất kho' });
    }
};

// ======================================================================
// 7. XUẤT TỰ ĐỘNG (Gọi từ orderController khi COMPLETED)
//    Không expose ra route - dùng nội bộ
// ======================================================================
exports.autoDeductStock = async (connection, orderId) => {
    try {
        // Lấy danh sách items trong đơn hàng
        const [orderItems] = await connection.query(
            `SELECT od.product_id, od.quantity, od.product_name
             FROM order_details od
             WHERE od.order_id = ?`,
            [orderId]
        );

        if (!orderItems || orderItems.length === 0) return;

        // Tìm các mặt hàng kho có linked_product_id khớp
        const productIds = orderItems.map(i => i.product_id);
        if (productIds.length === 0) return;

        const [inventoryItems] = await connection.query(
            `SELECT item_id, linked_product_id, quantity, unit
             FROM inventory_items 
             WHERE linked_product_id IN (?) AND is_active = 1`,
            [productIds]
        );

        if (!inventoryItems || inventoryItems.length === 0) return;

        // Map: product_id → inventory item
        const invMap = {};
        inventoryItems.forEach(inv => {
            invMap[inv.linked_product_id] = inv;
        });

        // Trừ kho cho từng sản phẩm
        for (const orderItem of orderItems) {
            const inv = invMap[orderItem.product_id];
            if (!inv) continue; // Sản phẩm này không liên kết kho

            const deductQty = Number(orderItem.quantity);

            await connection.query(
                'UPDATE inventory_items SET quantity = GREATEST(0, quantity - ?) WHERE item_id = ?',
                [deductQty, inv.item_id]
            );

            // Lấy tồn sau
            const [after] = await connection.query(
                'SELECT quantity FROM inventory_items WHERE item_id = ?',
                [inv.item_id]
            );

            // Ghi lịch sử
            await connection.query(
                `INSERT INTO inventory_transactions 
                (item_id, type, quantity, stock_after, reference_order_id, note)
                VALUES (?, 'EXPORT_AUTO', ?, ?, ?, ?)`,
                [inv.item_id, deductQty, Number(after[0].quantity), orderId,
                `Thanh toán đơn #${orderId}: ${orderItem.product_name} x${deductQty}`]
            );
        }

        console.log(`[Auto-deduct] Đã xử lý kho cho đơn #${orderId}`);
    } catch (error) {
        console.error(`[Auto-deduct] Lỗi xử lý kho đơn #${orderId}:`, error.message);
        // Không throw - không để lỗi kho block thanh toán
    }
};

// ======================================================================
// 8. GET /api/inventory/:id/history - Lịch sử giao dịch
// ======================================================================
exports.getTransactionHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = Math.min(100, Number(req.query.limit || 50));

        const [rows] = await db.query(
            `SELECT t.*, i.item_name, u.full_name
             FROM inventory_transactions t
             JOIN inventory_items i ON t.item_id = i.item_id
             LEFT JOIN users u ON t.created_by_user_id = u.user_id
             WHERE t.item_id = ?
             ORDER BY t.created_at DESC
             LIMIT ?`,
            [id, limit]
        );

        res.status(200).json(rows.map(mapTransaction));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy lịch sử' });
    }
};

// ======================================================================
// 9. PATCH /api/inventory/:id/status - Bật/tắt
// ======================================================================
exports.toggleInventoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await db.query('UPDATE inventory_items SET is_active = ? WHERE item_id = ?', [
            is_active ? 1 : 0, id,
        ]);

        const [rows] = await db.query(
            `SELECT i.*, p.product_name FROM inventory_items i
             LEFT JOIN products p ON i.linked_product_id = p.product_id
             WHERE i.item_id = ?`, [id]
        );
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy' });
        }

        res.status(200).json(mapRow(rows[0]));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
};
