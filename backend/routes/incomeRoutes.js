const express = require('express');
const {
    createIncome,
    getIncome,
    getIncomeByMonth,
    getIncomeBySource,
    updateIncome,
    deleteIncome
} = require('../controllers/incomeController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Income routes
router.post('/create', createIncome);
router.get('/all', getIncome);
router.get('/monthly', getIncomeByMonth);
router.get('/source', getIncomeBySource);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
