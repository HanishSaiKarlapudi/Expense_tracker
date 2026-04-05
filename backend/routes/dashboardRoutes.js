const express = require('express');
const {
    getDashboardSummary,
    getMonthlyExpenses,
    predictBudgetOverflow,
    getAiSuggestions
} = require('../controllers/dashboardController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/summary', getDashboardSummary);
router.get('/monthly-expenses', getMonthlyExpenses);
router.get('/suggestions', getAiSuggestions);
router.get('/ai-suggestions', getAiSuggestions);
router.get('/predict-overflow', predictBudgetOverflow);

module.exports = router;
