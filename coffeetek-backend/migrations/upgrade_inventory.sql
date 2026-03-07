-- =====================================================
-- Migration: Nâng cấp bảng inventory_items
-- 
-- SCHEMA HIỆN TẠI:
-- CREATE TABLE inventory_items (
--     item_id INT AUTO_INCREMENT PRIMARY KEY,
--     item_name VARCHAR(255) NOT NULL,
--     unit ENUM('goi', 'lon', 'chai', 'kg', 'gam') NOT NULL,
--     quantity DECIMAL(10, 2) DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );
--
-- CHẠY TỪNG BƯỚC, NẾU BƯỚC NÀO BÁO "already exists" THÌ BỎ QUA
-- =====================================================

-- -----------------------------------------------
-- BƯỚC 1: Thêm category "Khác" để bán hàng trực tiếp
-- -----------------------------------------------
INSERT IGNORE INTO categories (category_name) VALUES ('Khác');

-- -----------------------------------------------
-- BƯỚC 2: Đổi cột unit từ ENUM sang VARCHAR 
-- (để hỗ trợ thêm đơn vị: hop, cai, lit,...)
-- -----------------------------------------------
ALTER TABLE inventory_items MODIFY COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'chai';

-- -----------------------------------------------
-- BƯỚC 3: Thêm cột is_active (bảng cũ chưa có)
-- -----------------------------------------------
ALTER TABLE inventory_items ADD COLUMN is_active TINYINT(1) DEFAULT 1;

-- -----------------------------------------------
-- BƯỚC 4: Thêm cột import_unit (đơn vị nhập: thùng, bao, lốc...)
-- -----------------------------------------------
ALTER TABLE inventory_items ADD COLUMN import_unit VARCHAR(50) DEFAULT NULL AFTER unit;

-- -----------------------------------------------
-- BƯỚC 5: Thêm cột conversion_factor (hệ số quy đổi)
-- VD: 1 Thùng = 24 Lon → conversion_factor = 24
-- -----------------------------------------------
ALTER TABLE inventory_items ADD COLUMN conversion_factor INT DEFAULT 1 AFTER import_unit;

-- -----------------------------------------------
-- BƯỚC 6: Thêm cột min_stock_level (mức tối thiểu cảnh báo)
-- -----------------------------------------------
ALTER TABLE inventory_items ADD COLUMN min_stock_level INT DEFAULT 0 AFTER conversion_factor;

-- -----------------------------------------------
-- BƯỚC 7: Thêm cột linked_product_id (liên kết 1-1 với sản phẩm menu)
-- Dùng cho hàng bán trực tiếp: auto trừ kho khi thanh toán
-- -----------------------------------------------
ALTER TABLE inventory_items ADD COLUMN linked_product_id INT DEFAULT NULL AFTER min_stock_level;
ALTER TABLE inventory_items ADD INDEX idx_inv_linked_product (linked_product_id);

-- -----------------------------------------------
-- BƯỚC 8: Tạo bảng lịch sử giao dịch kho (Audit Trail)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    
    -- Loại giao dịch
    -- IMPORT        = Nhập kho
    -- EXPORT_MANUAL = Xuất thủ công (nhân viên tạo phiếu)
    -- EXPORT_AUTO   = Xuất tự động (khi đơn hàng COMPLETED)
    -- ADJUST        = Điều chỉnh kiểm kê
    type ENUM('IMPORT','EXPORT_MANUAL','EXPORT_AUTO','ADJUST') NOT NULL,
    
    -- Số lượng thay đổi (tính theo đơn vị cơ bản, luôn dương)
    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Thông tin quy đổi (chỉ điền khi nhập theo đơn vị lớn)
    import_unit VARCHAR(50) DEFAULT NULL,       -- VD: 'thung'
    import_quantity DECIMAL(12,2) DEFAULT NULL,  -- VD: 5 (thùng)
    
    -- Tồn kho sau giao dịch
    stock_after DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Tham chiếu
    reference_order_id INT DEFAULT NULL,     -- ID đơn hàng (nếu xuất tự động)
    created_by_user_id INT DEFAULT NULL,     -- Người thực hiện
    
    note VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    INDEX idx_inv_trans_item (item_id),
    INDEX idx_inv_trans_type (type),
    INDEX idx_inv_trans_date (created_at)
);

-- -----------------------------------------------
-- BƯỚC 9 (TÙY CHỌN): Tạo bảng liên kết promo nếu chưa có
-- (Từ tính năng promo trước đó)
-- -----------------------------------------------
-- Bỏ qua nếu đã chạy migration promo

ALTER TABLE promotions ADD COLUMN apply_to ENUM('BILL','CATEGORY','PRODUCT') DEFAULT 'BILL' AFTER discount_value;
ALTER TABLE promotions ADD COLUMN min_order_amount DECIMAL(12,2) DEFAULT 0 AFTER apply_to;

CREATE TABLE IF NOT EXISTS promotion_products (
    promo_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (promo_id, product_id),
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotion_categories (
    promo_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (promo_id, category_id),
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- =====================================================
-- KIỂM TRA SAU KHI CHẠY:
-- =====================================================
-- DESCRIBE inventory_items;
-- Phải thấy các cột: item_id, item_name, unit (VARCHAR), 
--   import_unit, conversion_factor, min_stock_level,
--   linked_product_id, quantity, is_active, created_at, updated_at
--
-- SHOW TABLES LIKE 'inventory_transactions';
-- Phải thấy bảng inventory_transactions
--
-- SELECT * FROM categories WHERE category_name = 'Khác';
-- Phải thấy 1 dòng
-- =====================================================
