const express = require('express');
const router = express.Router();
const validator = require('express-validator');

const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);
const credentialValidation = [
    validator.check('email').isEmail().withMessage('Please provide proper email'),
    validator.check('password').isLength({min:5}).withMessage('Password must be atleast 5 letters long')
];
router.post('/login', credentialValidation, authController.postLogin);

router.get('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup', credentialValidation, authController.postSignup);

router.get('/verify', authController.getVerify);
router.post('/verify', authController.postVerify);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);


module.exports = router;