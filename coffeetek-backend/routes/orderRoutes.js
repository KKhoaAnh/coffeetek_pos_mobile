const express = require('express');
const router = express.Router();
const { Joi, validateBody } = require('../middleware/validate');
const orderController = require('../controllers/orderController');

const orderItemSchema = Joi.object({
    order_detail_id: Joi.number().integer().min(1).optional(),
    product_id: Joi.number().integer().required(),
    product_name: Joi.string().trim().required(),
    price: Joi.number().required(),
    quantity: Joi.number().integer().min(1).required(),
    total_line_amount: Joi.number().required(),
    note: Joi.string().allow('', null),
    modifiers: Joi.array()
        .items(
            Joi.object({
                id: Joi.alternatives(Joi.number(), Joi.string()).optional(),
                modifier_id: Joi.alternatives(Joi.number(), Joi.string()).optional(),
                name: Joi.string().optional(),
                modifier_name: Joi.string().optional(),
                extraPrice: Joi.number().optional(),
                extra_price: Joi.number().optional(),
                quantity: Joi.number().integer().min(1).optional(),
                userInput: Joi.string().allow('', null).optional(),
                note: Joi.string().allow('', null).optional(),
                modifier_note: Joi.string().allow('', null).optional(),
            })
        )
        .optional(),
});

const createOrderSchema = Joi.object({
    order_code: Joi.string().trim().required(),
    table_id: Joi.number().integer().allow(null),
    order_type: Joi.string().valid('DINE_IN', 'TAKE_AWAY', 'DELIVERY').required(),
    status: Joi.string().required(),
    payment_status: Joi.string().required(),
    total_amount: Joi.number().required(),
    discount_amount: Joi.number().min(0).default(0),
    tax_amount: Joi.number().min(0).default(0),
    note: Joi.string().allow('', null),
    created_by_user_id: Joi.number().integer().required(),
    items: Joi.array().items(orderItemSchema).min(1).required(),
});

const updateOrderSchema = Joi.object({
    table_id: Joi.number().integer().allow(null),
    order_type: Joi.string().valid('DINE_IN', 'TAKE_AWAY', 'DELIVERY').optional(),
    status: Joi.string().optional(),
    payment_status: Joi.string().optional(),
    total_amount: Joi.number().optional(),
    discount_amount: Joi.number().min(0).optional(),
    tax_amount: Joi.number().min(0).optional(),
    note: Joi.string().allow('', null).optional(),
    created_by_user_id: Joi.number().integer().optional(),
    items: Joi.array().items(orderItemSchema).optional(),
});

router.post('/', validateBody(createOrderSchema), orderController.createOrder);

router.get('/pending', orderController.getPendingOrders);

router.get('/:id', orderController.getOrderById);

router.put('/:id', validateBody(updateOrderSchema), orderController.updateOrder);

router.put('/:id/print-count', orderController.incrementPrintCount);

module.exports = router;