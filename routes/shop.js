const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');
const isAuth = require('../middleware').isAuth;

router.get('/', shopController.getShowProducts);
router.post('/', shopController.postShowProducts);

router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', isAuth, shopController.postCart);
router.post('/cart-decrease-item', isAuth, shopController.decreaseItemInCart);
router.post('/cart-increase-item', isAuth, shopController.increaseItemInCart);

router.get('/orders', isAuth, shopController.orders);
router.get('/order/:orderId', isAuth, shopController.getInvoice);

router.get('/products', shopController.products);
router.get('/products/:productId', shopController.getProductById);

router.post('/checkout', isAuth, shopController.checkout);
router.post('/create-checkout-session', isAuth, shopController.createCheckoutSessions);
router.use('/checkout/success', isAuth, shopController.postOrder);
router.use('/checkout/cancel', isAuth, shopController.paymentFailure);


module.exports = router;