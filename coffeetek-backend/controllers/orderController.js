const db = require('../config/db');

const AppError = require('../utils/AppError');
const { autoDeductStock } = require('./inventoryController');

exports.createOrder = async (req, res, next) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const orderData = req.body;

        // [MỚI] Tìm ca đang mở của nhân viên tạo đơn
        let shiftId = null;
        if (orderData.created_by_user_id) {
            const [openShifts] = await connection.query(
                "SELECT shift_id FROM shifts WHERE user_id = ? AND status = 'OPEN' LIMIT 1",
                [orderData.created_by_user_id]
            );
            if (openShifts.length > 0) {
                shiftId = openShifts[0].shift_id;
            }
        }

        const [orderResult] = await connection.query(
            `INSERT INTO orders 
            (order_code, table_id, order_type, status, payment_status, total_amount, discount_amount, tax_amount, note, created_by_user_id, shift_id, created_at, kitchen_print_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
            [
                orderData.order_code,
                orderData.table_id,
                orderData.order_type,
                orderData.status,
                orderData.payment_status,
                orderData.total_amount,
                orderData.discount_amount || 0,
                orderData.tax_amount || 0,
                orderData.note,
                orderData.created_by_user_id,
                shiftId
            ]
        );

        const newOrderId = orderResult.insertId;
        if (orderData.order_type === 'DINE_IN' && orderData.table_id) {
            await connection.query(
                "UPDATE tables SET status = 'OCCUPIED', current_order_id = ? WHERE table_id = ?",
                [newOrderId, orderData.table_id]
            );
        }

        if (orderData.items && orderData.items.length > 0) {
            // Batch insert order_details (1 query)
            const detailValues = orderData.items.map(item => [
                newOrderId,
                item.product_id,
                item.product_name,
                item.price,
                item.quantity,
                item.total_line_amount,
                item.note || '',
                'PENDING'
            ]);
            await connection.query(
                `INSERT INTO order_details 
                (order_id, product_id, product_name, price, quantity, total_line_amount, note, item_status) 
                VALUES ?`,
                [detailValues]
            );

            // Lấy danh sách order_detail_id vừa insert (theo thứ tự, dùng cho modifier)
            const [insertedRows] = await connection.query(
                'SELECT order_detail_id FROM order_details WHERE order_id = ? ORDER BY order_detail_id ASC',
                [newOrderId]
            );
            const detailIds = insertedRows.map(r => r.order_detail_id);

            // Gộp toàn bộ modifier rows và insert 1 lần
            const allModifierValues = [];
            orderData.items.forEach((item, index) => {
                const detailId = detailIds[index];
                if (!detailId || !item.modifiers || item.modifiers.length === 0) return;
                item.modifiers.forEach(mod => {
                    allModifierValues.push([
                        detailId,
                        mod.id,
                        mod.name,
                        mod.extraPrice,
                        1,
                        mod.userInput || mod.note || null
                    ]);
                });
            });
            if (allModifierValues.length > 0) {
                await connection.query(
                    `INSERT INTO order_modifier_details 
                    (order_detail_id, modifier_id, modifier_name, price, quantity, modifier_note) 
                    VALUES ?`,
                    [allModifierValues]
                );
            }
        }

        await connection.commit();
        console.log(`Đơn hàng đã được tạo: ${orderData.order_code}`);

        res.status(201).json({
            message: 'Tạo đơn hàng thành công',
            order_id: newOrderId,
            order_code: orderData.order_code
        });

    } catch (error) {
        await connection.rollback();
        next(new AppError(500, 'Lỗi server khi tạo đơn hàng', 'ORDER_CREATE_FAILED'));
    } finally {
        connection.release();
    }
};

exports.getPendingOrders = async (_req, res, next) => {
    try {
        const query = `
            SELECT 
                o.order_id, 
                o.order_code, 
                o.table_id,
                t.table_name,
                o.total_amount, 
                o.created_at 
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.table_id
            WHERE o.status = 'PENDING' 
            ORDER BY o.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(new AppError(500, 'Lỗi lấy danh sách đơn chờ', 'ORDER_PENDING_FETCH_FAILED'));
    }
};

// exports.getOrderById = async (req, res, next) => {
//     try {
//         const orderId = req.params.id;

//         const query = `
//             SELECT o.*, t.table_name 
//             FROM orders o
//             LEFT JOIN tables t ON o.table_id = t.table_id
//             WHERE o.order_id = ?
//         `;
//         const [orderRows] = await db.query(query, [orderId]);
//         if (orderRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
//         const order = orderRows[0];

//         // const [itemRows] = await db.query('SELECT * FROM order_details WHERE order_id = ?', [orderId]);

//         const [itemRows] = await db.query(`
//             SELECT od.*, p.image_url 
//             FROM order_details od
//             LEFT JOIN products p ON od.product_id = p.product_id
//             WHERE od.order_id = ?
//         `, [orderId]);

//         const itemsWithModifiers = [];

//         for (const item of itemRows) {
//             const [modRows] = await db.query(
//                 `SELECT 
//                     modifier_id as id, 
//                     modifier_name as name, 
//                     price as extraPrice, 
//                     modifier_note as userInput
//                  FROM order_modifier_details 
//                  WHERE order_detail_id = ?`, 
//                 [item.order_detail_id]
//             );

//             const modifiers = modRows.map(m => ({
//                 ...m,
//                 extraPrice: parseFloat(m.extraPrice)
//             }));

//             itemsWithModifiers.push({
//                 ...item,
//                 price: parseFloat(item.price),
//                 total_line_amount: parseFloat(item.total_line_amount),
//                 image_url: item.image_url,
//                 modifiers: modifiers
//             });
//         }

//         const fullOrder = {
//             ...order,
//             total_amount: parseFloat(order.total_amount),
//             items: itemsWithModifiers
//         };

//         res.status(200).json(fullOrder);

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi lấy chi tiết đơn hàng' });
//     }
// };

exports.getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // 1. Lấy thông tin đơn hàng + bàn (1 query)
        const [orderRows] = await db.query(`
            SELECT o.*, t.table_name 
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.table_id
            WHERE o.order_id = ?
        `, [orderId]);

        if (orderRows.length === 0) {
            return next(new AppError(404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND'));
        }
        const order = orderRows[0];

        // 2. Lấy toàn bộ chi tiết món + ảnh (1 query)
        const [itemRows] = await db.query(`
            SELECT od.*, p.image_url 
            FROM order_details od
            LEFT JOIN products p ON od.product_id = p.product_id
            WHERE od.order_id = ?
        `, [orderId]);

        if (itemRows.length === 0) {
            return res.status(200).json({
                ...order,
                total_amount: parseFloat(order.total_amount),
                items: []
            });
        }

        const detailIds = itemRows.map(r => r.order_detail_id);

        // 3. Lấy toàn bộ modifier của đơn trong 1 query (tránh N+1)
        const [allModRows] = await db.query(`
            SELECT order_detail_id, modifier_id, modifier_name, price as extra_price, quantity
            FROM order_modifier_details
            WHERE order_detail_id IN (?)
        `, [detailIds]);

        const modsByDetailId = new Map();
        for (const m of allModRows) {
            const list = modsByDetailId.get(m.order_detail_id) || [];
            list.push({
                modifier_id: m.modifier_id,
                modifier_name: m.modifier_name,
                extra_price: parseFloat(m.extra_price),
                quantity: m.quantity
            });
            modsByDetailId.set(m.order_detail_id, list);
        }

        const itemsWithModifiers = itemRows.map(item => ({
            order_detail_id: item.order_detail_id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            note: item.note,
            image_url: item.image_url,
            total_line_amount: parseFloat(item.total_line_amount),
            modifiers: modsByDetailId.get(item.order_detail_id) || []
        }));

        res.status(200).json({
            ...order,
            total_amount: parseFloat(order.total_amount),
            items: itemsWithModifiers
        });

    } catch (error) {
        next(new AppError(500, 'Lỗi lấy chi tiết đơn hàng', 'ORDER_DETAIL_FETCH_FAILED'));
    }
};

exports.updateOrder = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const orderId = req.params.id;
        const orderData = req.body;

        const [oldOrderRows] = await connection.query(
            "SELECT table_id FROM orders WHERE order_id = ?",
            [orderId]
        );
        let oldTableId = null;
        if (oldOrderRows.length > 0) {
            oldTableId = oldOrderRows[0].table_id;
        }

        const [checkRows] = await connection.query(
            "SELECT status FROM orders WHERE order_id = ? AND status = 'PENDING'",
            [orderId]
        );
        if (checkRows.length === 0) {
            await connection.rollback();
            return next(
                new AppError(
                    400,
                    'Đơn hàng không tồn tại hoặc đã hoàn thành, không thể sửa.',
                    'ORDER_UPDATE_INVALID_STATUS'
                )
            );
        }

        await connection.query(
            `UPDATE orders SET 
                table_id = ?, 
                order_type = ?, 
                total_amount = ?, 
                discount_amount = ?, 
                tax_amount = ?, 
                note = ?,
                payment_status = ?,
                final_amount = ?
            WHERE order_id = ?`,
            [
                orderData.table_id,
                orderData.order_type,
                orderData.total_amount,
                orderData.discount_amount || 0,
                orderData.tax_amount || 0,
                orderData.note,
                orderData.payment_status,
                orderData.final_amount || (orderData.total_amount - (orderData.discount_amount || 0)),
                orderId
            ]
        );

        if (orderData.table_id && oldTableId && oldTableId !== orderData.table_id) {
            await connection.query(
                "UPDATE tables SET status = 'AVAILABLE', current_order_id = NULL WHERE table_id = ?",
                [oldTableId]
            );

            await connection.query(
                "UPDATE tables SET status = 'OCCUPIED', current_order_id = ? WHERE table_id = ?",
                [orderId, orderData.table_id]
            );
        }
        else if (orderData.order_type === 'DINE_IN' && orderData.table_id) {
            await connection.query(
                "UPDATE tables SET status = 'OCCUPIED', current_order_id = ? WHERE table_id = ?",
                [orderId, orderData.table_id]
            );
        }

        let targetItemStatus = 'PENDING';
        if (orderData.status === 'COMPLETED') {
            await connection.query("UPDATE orders SET status = 'COMPLETED', completed_at = NOW() WHERE order_id = ?", [orderId]);

            await connection.query(
                "UPDATE tables SET status = 'CLEANING', current_order_id = NULL WHERE current_order_id = ?",
                [orderId]
            );

            targetItemStatus = 'SERVED';

            // Cập nhật trạng thái tất cả item trong đơn thành SERVED
            await connection.query(
                "UPDATE order_details SET item_status = 'SERVED' WHERE order_id = ?",
                [orderId]
            );

            // [MỚI] Tự động trừ kho cho hàng bán trực tiếp (Pepsi, nước suối...)
            await autoDeductStock(connection, orderId);
        }

        if (orderData.status === 'CANCELLED') {
            await connection.query(
                "UPDATE order_details SET item_status = 'CANCELLED' WHERE order_id = ?",
                [orderId]
            );
        }

        // Chỉ upsert/delete chi tiết khi client gửi items (khi sửa đơn). Hoàn thành đơn thường không gửi items → giữ nguyên
        const items = Array.isArray(orderData.items) ? orderData.items : null;
        let existingDetails = [];
        let existingIds = new Set();
        let keptDetailIds = [];
        let idsToKeep = [];

        if (items !== null) {
            const [rows] = await connection.query(
                'SELECT order_detail_id FROM order_details WHERE order_id = ?',
                [orderId]
            );
            existingDetails = rows;
            existingIds = new Set(existingDetails.map(r => r.order_detail_id));

            // Upsert: cập nhật dòng có order_detail_id, gom dòng mới để batch insert
            const newItems = [];
            for (const item of items) {
                const detailId = item.order_detail_id != null ? Number(item.order_detail_id) : null;
                if (detailId && existingIds.has(detailId)) {
                    await connection.query(
                        `UPDATE order_details SET 
                    product_id = ?, product_name = ?, price = ?, quantity = ?, total_line_amount = ?, note = ?, item_status = ?
                    WHERE order_detail_id = ?`,
                        [
                            item.product_id,
                            item.product_name,
                            item.price,
                            item.quantity,
                            item.total_line_amount,
                            item.note || '',
                            targetItemStatus,
                            detailId
                        ]
                    );
                    await connection.query('DELETE FROM order_modifier_details WHERE order_detail_id = ?', [detailId]);
                    if (item.modifiers && item.modifiers.length > 0) {
                        const modValues = item.modifiers.map(mod => [
                            detailId,
                            mod.id != null ? mod.id.toString() : mod.modifier_id,
                            mod.name || mod.modifier_name,
                            parseFloat(mod.extraPrice != null ? mod.extraPrice : mod.extra_price || 0),
                            1,
                            mod.userInput || mod.note || mod.modifier_note || null
                        ]);
                        await connection.query(
                            `INSERT INTO order_modifier_details (order_detail_id, modifier_id, modifier_name, price, quantity, modifier_note) VALUES ?`,
                            [modValues]
                        );
                    }
                    keptDetailIds.push(detailId);
                } else {
                    newItems.push(item);
                }
            }

            idsToKeep = [...keptDetailIds];
            if (newItems.length > 0) {
                const newDetailValues = newItems.map(item => [
                    orderId,
                    item.product_id,
                    item.product_name,
                    item.price,
                    item.quantity,
                    item.total_line_amount,
                    item.note || '',
                    targetItemStatus
                ]);
                await connection.query(
                    `INSERT INTO order_details (order_id, product_id, product_name, price, quantity, total_line_amount, note, item_status) VALUES ?`,
                    [newDetailValues]
                );
                const [newRows] = await connection.query(
                    'SELECT order_detail_id FROM order_details WHERE order_id = ? ORDER BY order_detail_id ASC',
                    [orderId]
                );
                const allNewIds = newRows.map(r => r.order_detail_id);
                const insertedIds = allNewIds.filter(id => !existingIds.has(id));
                idsToKeep.push(...insertedIds);

                const allModifierValues = [];
                newItems.forEach((item, idx) => {
                    const detailId = insertedIds[idx];
                    if (!detailId || !item.modifiers || item.modifiers.length === 0) return;
                    item.modifiers.forEach(mod => {
                        allModifierValues.push([
                            detailId,
                            mod.id != null ? mod.id.toString() : mod.modifier_id,
                            mod.name || mod.modifier_name,
                            parseFloat(mod.extraPrice != null ? mod.extraPrice : mod.extra_price || 0),
                            1,
                            mod.userInput || mod.note || mod.modifier_note || null
                        ]);
                    });
                });
                if (allModifierValues.length > 0) {
                    await connection.query(
                        `INSERT INTO order_modifier_details (order_detail_id, modifier_id, modifier_name, price, quantity, modifier_note) VALUES ?`,
                        [allModifierValues]
                    );
                }
            }

            const idsToRemove = existingIds.size > 0
                ? existingDetails.map(r => r.order_detail_id).filter(id => !idsToKeep.includes(id))
                : [];
            if (idsToRemove.length > 0) {
                const ph = idsToRemove.map(() => '?').join(',');
                await connection.query(`DELETE FROM order_modifier_details WHERE order_detail_id IN (${ph})`, idsToRemove);
                await connection.query(`DELETE FROM order_details WHERE order_detail_id IN (${ph})`, idsToRemove);
            }
        }

        await connection.query(
            `INSERT INTO order_logs (order_id, old_status, new_status, action, changed_by_user_id, note) 
             VALUES (?, 'PENDING', ?, 'UPDATE', ?, 'Cập nhật đơn hàng')`,
            [orderId, orderData.status, orderData.created_by_user_id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Cập nhật đơn hàng thành công', order_id: orderId });

    } catch (error) {
        await connection.rollback();
        next(new AppError(500, 'Lỗi server khi cập nhật đơn', 'ORDER_UPDATE_FAILED'));
    } finally {
        connection.release();
    }
};

exports.incrementPrintCount = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        const orderId = req.params.id;

        await connection.query(
            "UPDATE orders SET kitchen_print_count = kitchen_print_count + 1 WHERE order_id = ?",
            [orderId]
        );

        const [rows] = await connection.query("SELECT kitchen_print_count FROM orders WHERE order_id = ?", [orderId]);

        const newCount = rows[0]?.kitchen_print_count || 1;

        res.status(200).json({ print_count: newCount });
    } catch (error) {
        next(new AppError(500, 'Lỗi cập nhật số lần in', 'ORDER_PRINTCOUNT_FAILED'));
    } finally {
        connection.release();
    }
};