const db = require('../config/db');
const AppError = require('../utils/AppError');

// ======================================================================
// HELPERS
// ======================================================================

const parseDaysOfWeek = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x !== '' && !Number.isNaN(Number(x)))
        .map((x) => Number(x));
};

const serializeDaysOfWeek = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    return arr.join(',');
};

// Cột SELECT chung
const PROMO_COLUMNS = `
    promo_id, promo_name, description, discount_type, discount_value, 
    apply_to, min_order_amount,
    start_date, end_date, days_of_week, time_start, time_end, 
    is_active, created_at, updated_at
`;

// Map DB row → API object
const mapPromotionRow = (row, linkedProducts = [], linkedCategories = []) => {
    return {
        promo_id: row.promo_id,
        promo_name: row.promo_name,
        description: row.description,
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value || 0),
        apply_to: row.apply_to || 'BILL',
        min_order_amount: Number(row.min_order_amount || 0),
        start_date: row.start_date,
        end_date: row.end_date,
        days_of_week: parseDaysOfWeek(row.days_of_week),
        time_start: row.time_start,
        time_end: row.time_end,
        is_active: row.is_active === 1 || row.is_active === true,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Danh sách sản phẩm/nhóm liên kết
        product_ids: linkedProducts,
        category_ids: linkedCategories,
    };
};

// Lấy danh sách product_ids và category_ids cho 1 promo
const getLinkedItems = async (promoId) => {
    const [products] = await db.query(
        'SELECT product_id FROM promotion_products WHERE promo_id = ?', [promoId]
    );
    const [categories] = await db.query(
        'SELECT category_id FROM promotion_categories WHERE promo_id = ?', [promoId]
    );
    return {
        product_ids: products.map(r => r.product_id),
        category_ids: categories.map(r => r.category_id),
    };
};

// Cập nhật bảng liên kết (xóa cũ, insert mới)
const syncLinkedItems = async (connection, promoId, applyTo, productIds, categoryIds) => {
    // Xóa cũ
    await connection.query('DELETE FROM promotion_products WHERE promo_id = ?', [promoId]);
    await connection.query('DELETE FROM promotion_categories WHERE promo_id = ?', [promoId]);

    // Insert mới theo apply_to
    if (applyTo === 'PRODUCT' && productIds && productIds.length > 0) {
        const values = productIds.map(pid => [promoId, pid]);
        await connection.query(
            'INSERT INTO promotion_products (promo_id, product_id) VALUES ?',
            [values]
        );
    }

    if (applyTo === 'CATEGORY' && categoryIds && categoryIds.length > 0) {
        const values = categoryIds.map(cid => [promoId, cid]);
        await connection.query(
            'INSERT INTO promotion_categories (promo_id, category_id) VALUES ?',
            [values]
        );
    }
};

// ======================================================================
// GET /api/promotions  (Danh sách tất cả, kèm linked items)
// ======================================================================
exports.getPromotions = async (_req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT ${PROMO_COLUMNS} FROM promotions ORDER BY created_at DESC`
        );

        // Lấy tất cả linked items trong 2 query gom
        const [allProducts] = await db.query('SELECT promo_id, product_id FROM promotion_products');
        const [allCategories] = await db.query('SELECT promo_id, category_id FROM promotion_categories');

        const productMap = {};
        allProducts.forEach(r => {
            if (!productMap[r.promo_id]) productMap[r.promo_id] = [];
            productMap[r.promo_id].push(r.product_id);
        });

        const categoryMap = {};
        allCategories.forEach(r => {
            if (!categoryMap[r.promo_id]) categoryMap[r.promo_id] = [];
            categoryMap[r.promo_id].push(r.category_id);
        });

        const result = rows.map(row => mapPromotionRow(
            row,
            productMap[row.promo_id] || [],
            categoryMap[row.promo_id] || []
        ));

        res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi getPromotions:', error);
        next(new AppError(500, 'Lỗi lấy danh sách khuyến mãi', 'PROMO_LIST_FAILED'));
    }
};

// ======================================================================
// GET /api/promotions/:id
// ======================================================================
exports.getPromotionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT ${PROMO_COLUMNS} FROM promotions WHERE promo_id = ?`, [id]
        );
        if (!rows || rows.length === 0) {
            return next(new AppError(404, 'Không tìm thấy khuyến mãi', 'PROMO_NOT_FOUND'));
        }

        const { product_ids, category_ids } = await getLinkedItems(id);
        res.status(200).json(mapPromotionRow(rows[0], product_ids, category_ids));
    } catch (error) {
        next(new AppError(500, 'Lỗi lấy chi tiết khuyến mãi', 'PROMO_DETAIL_FAILED'));
    }
};

// ======================================================================
// POST /api/promotions  (Tạo mới)
// ======================================================================
exports.createPromotion = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            promo_name, description, discount_type, discount_value,
            apply_to, min_order_amount,
            start_date, end_date, days_of_week, time_start, time_end,
            is_active, product_ids, category_ids,
        } = req.body;

        const daysString = serializeDaysOfWeek(days_of_week);

        const [result] = await connection.query(
            `INSERT INTO promotions 
            (promo_name, description, discount_type, discount_value, apply_to, min_order_amount, start_date, end_date, days_of_week, time_start, time_end, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                promo_name,
                description || null,
                discount_type,
                discount_value,
                apply_to || 'BILL',
                min_order_amount || 0,
                start_date,
                end_date,
                daysString,
                time_start || null,
                time_end || null,
                is_active ? 1 : 0,
            ]
        );

        const promoId = result.insertId;

        // Sync bảng liên kết
        await syncLinkedItems(connection, promoId, apply_to || 'BILL', product_ids || [], category_ids || []);

        await connection.commit();

        // Lấy lại row đã tạo
        const [rows] = await db.query(`SELECT ${PROMO_COLUMNS} FROM promotions WHERE promo_id = ?`, [promoId]);
        const linked = await getLinkedItems(promoId);

        res.status(201).json(mapPromotionRow(rows[0], linked.product_ids, linked.category_ids));
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi createPromotion:', error);
        next(new AppError(500, 'Lỗi tạo khuyến mãi', 'PROMO_CREATE_FAILED'));
    } finally {
        connection.release();
    }
};

// ======================================================================
// PUT /api/promotions/:id  (Cập nhật)
// ======================================================================
exports.updatePromotion = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            promo_name, description, discount_type, discount_value,
            apply_to, min_order_amount,
            start_date, end_date, days_of_week, time_start, time_end,
            is_active, product_ids, category_ids,
        } = req.body;

        const daysString = serializeDaysOfWeek(days_of_week);

        await connection.query(
            `UPDATE promotions 
            SET promo_name = ?, description = ?, discount_type = ?, discount_value = ?, 
                apply_to = ?, min_order_amount = ?,
                start_date = ?, end_date = ?, days_of_week = ?, time_start = ?, time_end = ?, is_active = ?
            WHERE promo_id = ?`,
            [
                promo_name,
                description || null,
                discount_type,
                discount_value,
                apply_to || 'BILL',
                min_order_amount || 0,
                start_date,
                end_date,
                daysString,
                time_start || null,
                time_end || null,
                is_active ? 1 : 0,
                id,
            ]
        );

        // Sync bảng liên kết
        await syncLinkedItems(connection, id, apply_to || 'BILL', product_ids || [], category_ids || []);

        await connection.commit();

        const [rows] = await db.query(`SELECT ${PROMO_COLUMNS} FROM promotions WHERE promo_id = ?`, [id]);
        if (!rows || rows.length === 0) {
            return next(new AppError(404, 'Không tìm thấy khuyến mãi', 'PROMO_NOT_FOUND'));
        }

        const linked = await getLinkedItems(id);
        res.status(200).json(mapPromotionRow(rows[0], linked.product_ids, linked.category_ids));
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi updatePromotion:', error);
        next(new AppError(500, 'Lỗi cập nhật khuyến mãi', 'PROMO_UPDATE_FAILED'));
    } finally {
        connection.release();
    }
};

// ======================================================================
// PATCH /api/promotions/:id/active
// ======================================================================
exports.togglePromotionActive = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await db.query('UPDATE promotions SET is_active = ? WHERE promo_id = ?', [
            is_active ? 1 : 0, id,
        ]);

        const [rows] = await db.query(`SELECT ${PROMO_COLUMNS} FROM promotions WHERE promo_id = ?`, [id]);
        if (!rows || rows.length === 0) {
            return next(new AppError(404, 'Không tìm thấy khuyến mãi', 'PROMO_NOT_FOUND'));
        }

        const linked = await getLinkedItems(id);
        res.status(200).json(mapPromotionRow(rows[0], linked.product_ids, linked.category_ids));
    } catch (error) {
        next(new AppError(500, 'Lỗi cập nhật trạng thái khuyến mãi', 'PROMO_TOGGLE_FAILED'));
    }
};
