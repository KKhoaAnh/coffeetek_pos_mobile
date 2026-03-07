-- =====================================================
-- Migration: Nâng cấp hệ thống Khuyến mãi (Promotions)
-- Thêm scope áp dụng: BILL / CATEGORY / PRODUCT
-- =====================================================

-- 1. Thêm cột apply_to cho biết phạm vi áp dụng
-- 'BILL' = áp dụng tổng đơn (mặc định, behavior cũ)
-- 'CATEGORY' = áp dụng cho một nhóm món
-- 'PRODUCT' = áp dụng cho món cụ thể
ALTER TABLE promotions ADD COLUMN apply_to ENUM('BILL','CATEGORY','PRODUCT') DEFAULT 'BILL' AFTER discount_value;

-- 2. Thêm cột min_order_amount: điều kiện đơn tối thiểu cho promo BILL
ALTER TABLE promotions ADD COLUMN min_order_amount DECIMAL(12,2) DEFAULT 0 AFTER apply_to;

-- 3. Tạo bảng liên kết promo → products (nhiều-nhiều)
CREATE TABLE IF NOT EXISTS promotion_products (
    promo_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (promo_id, product_id),
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 4. Tạo bảng liên kết promo → categories (nhiều-nhiều)
CREATE TABLE IF NOT EXISTS promotion_categories (
    promo_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (promo_id, category_id),
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);
