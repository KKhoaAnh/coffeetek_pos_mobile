const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Danh sách & Cảnh báo
router.get('/', inventoryController.getInventoryItems);
router.get('/low-stock', inventoryController.getLowStockItems);

// CRUD mặt hàng
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.patch('/:id/status', inventoryController.toggleInventoryStatus);

// Nhập / Xuất kho
router.post('/:id/import', inventoryController.importStock);
router.post('/:id/export', inventoryController.exportStock);

// Lịch sử giao dịch
router.get('/:id/history', inventoryController.getTransactionHistory);

module.exports = router;
