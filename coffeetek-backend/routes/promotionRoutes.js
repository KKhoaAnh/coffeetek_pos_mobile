const express = require('express');
const router = express.Router();
const { Joi, validateBody } = require('../middleware/validate');
const promotionController = require('../controllers/promotionController');

const daysOfWeekSchema = Joi.array()
  .items(Joi.number().integer().min(0).max(6))
  .optional();

const basePromoSchema = {
  promo_name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  discount_type: Joi.string().valid('percent', 'fixed').required(),
  discount_value: Joi.number().min(0).required(),
  // [MỚI] Phạm vi áp dụng
  apply_to: Joi.string().valid('BILL', 'CATEGORY', 'PRODUCT').default('BILL'),
  min_order_amount: Joi.number().min(0).default(0),
  // Danh sách product/category IDs liên kết
  product_ids: Joi.array().items(Joi.number().integer()).optional(),
  category_ids: Joi.array().items(Joi.number().integer()).optional(),
  start_date: Joi.string().trim().required(),
  end_date: Joi.string().trim().required(),
  days_of_week: daysOfWeekSchema,
  time_start: Joi.string().trim().allow(null, ''),
  time_end: Joi.string().trim().allow(null, ''),
  is_active: Joi.boolean().default(true),
};

const createPromotionSchema = Joi.object(basePromoSchema);

const updatePromotionSchema = Joi.object({
  ...basePromoSchema,
}).min(1);

const toggleActiveSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotionById);
router.post('/', validateBody(createPromotionSchema), promotionController.createPromotion);
router.put('/:id', validateBody(updatePromotionSchema), promotionController.updatePromotion);
router.patch('/:id/active', validateBody(toggleActiveSchema), promotionController.togglePromotionActive);

module.exports = router;
