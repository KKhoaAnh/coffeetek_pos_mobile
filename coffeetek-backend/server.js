require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const authMiddleware = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const modifierRoutes = require('./routes/modifierRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
// app.use('/uploads', express.static('uploads'));

// Chỉ /api/auth không cần token (đăng nhập)
app.use('/api/auth', authRoutes);

// Các route sau yêu cầu Authorization: Bearer <token>
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/tables', authMiddleware, tableRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/modifiers', authMiddleware, modifierRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/shifts', authMiddleware, shiftRoutes);
app.use('/api/promotions', authMiddleware, promotionRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('CoffeeTek POS API is running...');
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại http://0.0.0.0:${PORT}`);
});