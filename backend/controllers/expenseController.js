const Expense = require('../models/Expense');

// Create expense
exports.createExpense = async (req, res) => {
    const { category, amount, description, date, paymentMethod } = req.body;

    if (!category || !amount) {
        return res.status(400).json({ message: 'Please provide category and amount' });
    }

    try {
        const expense = await Expense.create({
            user: req.user.id,
            category,
            amount,
            description,
            date: date || Date.now(),
            paymentMethod: paymentMethod || 'Cash'
        });

        res.status(201).json({
            success: true,
            expense
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating expense', error: error.message });
    }
};

// Get all expenses for user
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
        
        res.status(200).json({
            success: true,
            expenses
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
};

// Get expenses for a specific month/year
exports.getExpensesByMonth = async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ message: 'Please provide month and year' });
    }

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const expenses = await Expense.find({
            user: req.user.id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        res.status(200).json({
            success: true,
            expenses,
            totalExpense
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
};

// Get expense by category
exports.getExpensesByCategory = async (req, res) => {
    try {
        const categoryWiseExpenses = await Expense.aggregate([
            { $match: { user: require('mongoose').Types.ObjectId(req.user.id) } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            success: true,
            categoryWiseExpenses
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses by category', error: error.message });
    }
};

// Update expense
exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({
            success: true,
            expense
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating expense', error: error.message });
    }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expense', error: error.message });
    }
};
