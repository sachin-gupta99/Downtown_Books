const express = require('express');
const router = express.Router();
const validator = require('express-validator');

const adminController = require('../controllers/products');
const isAuth = require('../middleware').isAuth;
const isAdmin = require('../middleware').isAdmin;


router.get('/add-products', isAuth, isAdmin, adminController.getAddProducts);
const validation = [
    validator.check('title').not().isEmpty().withMessage('Title can\'t be blank'),
    validator.check('price').isFloat({min: 0}).withMessage('Price cannot be negative'),
    validator.check('description').isLength({min: 10}).withMessage('Description must be at least 10 characters')
];
router.post('/add-products', isAuth, isAdmin, validation, adminController.postAddProducts);

router.get('/products', isAuth, isAdmin, adminController.getAdminProducts);
router.use('/edit-products', isAuth, isAdmin, adminController.EditProducts);
router.post('/update-product', isAuth, isAdmin, validation, adminController.UpdateProduct);
router.post('/delete-product', isAuth, isAdmin, adminController.deleteProduct);



module.exports = router;