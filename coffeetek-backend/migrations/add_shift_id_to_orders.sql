-- =====================================================
-- Migration: Nâng cấp hệ thống Ca làm việc (Shifts)
-- Chạy file này trên MySQL trước khi deploy code mới
-- =====================================================

-- -----------------------------------------------
-- 1. Thêm cột shift_id vào bảng orders
-- -----------------------------------------------
ALTER TABLE orders ADD COLUMN shift_id INT DEFAULT NULL AFTER created_by_user_id;
ALTER TABLE orders ADD INDEX idx_orders_shift (shift_id);

-- -----------------------------------------------
-- 2. Thêm cột total_sales vào bảng shifts (nếu chưa có)
-- -----------------------------------------------
-- total_sales = tổng doanh thu tất cả phương thức thanh toán
ALTER TABLE shifts ADD COLUMN total_sales DECIMAL(12,2) DEFAULT 0 AFTER note;
