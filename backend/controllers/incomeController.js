const Income = require('../models/Income');

// Create income
exports.createIncome = async (req, res) => {
    const { source, amount, description, date } = req.body;

    if (!source || !amount) {
        return res.status(400).json({ message: 'Please provide source and amount' });
    }

    try {
        const income = await Income.create({
            user: req.user.id,
            source,
            amount,
            description,
            date: date || Date.now()
        });

        res.status(201).json({
            success: true,
            income
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating income', error: error.message });
    }
};

// Get all income for user
exports.getIncome = async (req, res) => {
    try {
        const income = await Income.find({ user: req.user.id }).sort({ date: -1 });
        
        res.status(200).json({
            success: true,
            income
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching income', error: error.message });
    }
};

// Get income for a specific month/year
exports.getIncomeByMonth = async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ message: 'Please provide month and year' });
    }

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const income = await Income.find({
            user: req.user.id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

        res.status(200).json({
            success: true,
            income,
            totalIncome
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching income', error: error.message });
    }
};

// Get income by source
exports.getIncomeBySource = async (req, res) => {
    try {
        const sourceWiseIncome = await Income.aggregate([
            { $match: { user: require('mongoose').Types.ObjectId(req.user.id) } },
            { $group: { _id: '$source', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            success: true,
            sourceWiseIncome
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching income by source', error: error.message });
    }
};

// Update income
exports.updateIncome = async (req, res) => {
    try {
        const income = await Income.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        res.status(200).json({
            success: true,
            income
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating income', error: error.message });
    }
};

// Delete income
exports.deleteIncome = async (req, res) => {
    try {
        const income = await Income.findByIdAndDelete(req.params.id);

        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Income deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting income', error: error.message });
    }
};
