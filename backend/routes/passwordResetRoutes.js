const express = require('express');
const {
    forgotPassword,
    resetPassword,
    verifyResetToken
} = require('../controllers/passwordResetController');

const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token', verifyResetToken);

module.exports = router;
