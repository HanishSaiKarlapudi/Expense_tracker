const express = require('express');
const {
    createExpense,
    getExpenses,
    getExpensesByMonth,
    getExpensesByCategory,
    updateExpense,
    deleteExpense
} = require('../controllers/expenseController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Expense routes
router.post('/create', createExpense);
router.get('/all', getExpenses);
router.get('/monthly', getExpensesByMonth);
router.get('/category', getExpensesByCategory);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
