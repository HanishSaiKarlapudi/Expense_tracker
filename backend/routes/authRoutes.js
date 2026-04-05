const express = require('express');

const {
    registerUser,
    loginUser,
    getUserInfo,
    updateBudget,
    updateProfile,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/getUser', protect, getUserInfo);
router.put('/update-budget', protect, updateBudget);
router.put('/update-profile', protect, updateProfile);

module.exports = router;    