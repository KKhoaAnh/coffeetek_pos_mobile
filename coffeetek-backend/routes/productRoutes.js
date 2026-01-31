const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Đảm bảo thư mục 'uploads' đã tồn tại
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // Tên file: timestamp.jpg
    }
});
const upload = multer({ storage: storage });

router.put('/:id', upload.single('image'), productController.updateProduct);

router.put('/:id/status', productController.toggleProductStatus);

router.get('/', productController.getProducts);
router.get('/:id/modifiers', productController.getProductModifiers);
// router.post('/', productController.createProduct);
router.post('/', upload.single('image'), productController.createProduct);
// router.put('/:id', productController.updateProduct);
router.get('/categories', categoryController.getAllCategories);
router.get('/:id/modifier-ids', productController.getProductModifierIds);
module.exports = router;