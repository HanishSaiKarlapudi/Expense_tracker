const Expense = require('../models/Expense');
const Income = require('../models/Income');
const User = require('../models/User');
const axios = require('axios');

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);
        endDate.setHours(23, 59, 59, 999);

        // Get current month expenses
        const expenses = await Expense.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        // Get current month income
        const income = await Income.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

        // Get user for budget info
        const user = await User.findById(userId);
        const monthlyBudget = user?.monthlyBudget || 50000;
        const budgetUsed = (totalExpense / monthlyBudget * 100).toFixed(2);
        const budgetRemaining = monthlyBudget - totalExpense;

        // Get expense categories breakdown
        const categoryWise = await Expense.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: '$category', amount: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            success: true,
            summary: {
                totalExpense,
                totalIncome,
                monthlyBudget,
                budgetUsed,
                budgetRemaining,
                isOverBudget: totalExpense > monthlyBudget,
                categoryWise
            }
        });
    } catch (error) {
        console.error('Dashboard Summary Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
    }
};

// Get expenses for all months (for charts)
exports.getMonthlyExpenses = async (req, res) => {
    const { months = 6 } = req.query;

    try {
        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const monthlyData = [];
        const currentDate = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            const expenses = await Expense.find({
                user: userId,
                date: { $gte: startDate, $lte: endDate }
            });

            const income = await Income.find({
                user: userId,
                date: { $gte: startDate, $lte: endDate }
            });

            const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

            monthlyData.push({
                month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                expense: totalExpense,
                income: totalIncome
            });
        }

        res.status(200).json({
            success: true,
            monthlyData
        });
    } catch (error) {
        console.error('Monthly Expenses Error:', error);
        res.status(500).json({ message: 'Error fetching monthly expenses', error: error.message });
    }
};

// Get AI Suggestions - Backend generated (no external API)
exports.getAiSuggestions = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);
        endDate.setHours(23, 59, 59, 999);

        // Get expenses and income
        const expenses = await Expense.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        const income = await Income.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        const user = await User.findById(userId);
        const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
        const monthlyBudget = user?.monthlyBudget || 50000;

        // Get category wise spending
        const categoryMap = {};
        expenses.forEach(exp => {
            categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
        });

        const suggestions = [];

        // Suggestion 1: Budget status
        const budgetPercent = (totalExpense / monthlyBudget * 100).toFixed(1);
        if (totalExpense > monthlyBudget) {
            const overspend = (totalExpense - monthlyBudget).toFixed(2);
            suggestions.push(`⚠️ Budget Alert: You've exceeded your budget by ₹${overspend}. Your current spending is ${budgetPercent}% of your monthly budget of ₹${monthlyBudget}.`);
        } else if (budgetPercent > 80) {
            suggestions.push(`📊 Caution: You're using ${budgetPercent}% of your budget. Only ₹${(monthlyBudget - totalExpense).toFixed(2)} left for the rest of the month.`);
        } else {
            suggestions.push(`✅ You're doing great! You've used ${budgetPercent}% of your budget, staying within limits.`);
        }

        // Suggestion 2: Find highest spending category
        if (Object.keys(categoryMap).length > 0) {
            const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
            const topSpend = topCategory[1];
            const avgSpend = totalExpense / Object.keys(categoryMap).length;
            
            if (topSpend > avgSpend * 1.5) {
                suggestions.push(`💡 Optimization Tip: "${topCategory[0]}" is your highest spending category (₹${topSpend.toFixed(2)}). Consider setting stricter limits or finding alternatives to reduce costs here.`);
            }
        }

        // Suggestion 3: Income vs Expense ratio
        if (totalIncome > 0) {
            const savingsRate = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1);
            if (savingsRate > 20) {
                suggestions.push(`🎯 Excellent savings rate of ${savingsRate}%! Keep maintaining this healthy spending-to-income ratio.`);
            } else if (savingsRate > 5) {
                suggestions.push(`💰 You're saving ${savingsRate}% of your income. Try to increase your savings rate by optimizing expenses.`);
            } else if (savingsRate > 0) {
                suggestions.push(`⚡ Your savings rate is only ${savingsRate}%. Consider tracking discretionary expenses more carefully to improve savings.`);
            } else {
                suggestions.push(`🚨 Critical: You're spending more than you earn! Review your expenses immediately to avoid debt.`);
            }
        }

        // Suggestion 4: Daily spending advice
        const daysSpent = currentDate.getDate();
        const daysRemaining = endDate.getDate() - currentDate.getDate();
        const dailyAverage = (totalExpense / daysSpent).toFixed(2);
        const budgetPerDay = ((monthlyBudget - totalExpense) / Math.max(1, daysRemaining)).toFixed(2);

        suggestions.push(`📅 Daily Analysis: You've averaged ₹${dailyAverage} per day so far. To stay within budget, keep daily spending to ₹${budgetPerDay} for the remaining ${daysRemaining} days.`);

        res.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({ message: 'Error generating suggestions', error: error.message });
    }
};

// Predict budget overflow using ML model
exports.predictBudgetOverflow = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Get last 12 months of expense data
        const expenseHistory = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - i - 1, 1);
            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            const expenses = await Expense.find({
                user: userId,
                date: { $gte: startDate, $lte: endDate }
            });

            const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            expenseHistory.push(totalExpense);
        }

        // Prepare data for ML model
        const features = {
            month: currentMonth,
            prev_month_expense: expenseHistory[expenseHistory.length - 1] || 0,
            prev_2_month_expense: expenseHistory[expenseHistory.length - 2] || 0,
            prev_3_month_expense: expenseHistory[expenseHistory.length - 3] || 0,
            rolling_3_avg: (expenseHistory.slice(-3).reduce((a, b) => a + b, 0) / 3) || 0,
            rolling_6_avg: (expenseHistory.slice(-6).reduce((a, b) => a + b, 0) / 6) || 0,
            expense_history: expenseHistory
        };

        const user = await User.findById(userId);
        const monthlyBudget = user?.monthlyBudget || 50000;

        // Call Python ML API (you'll run this separately)
        try {
            const mlResponse = await axios.post('http://localhost:5001/predict', features, {
                timeout: 5000
            });

            const predictedExpense = mlResponse.data.prediction;
            const willExceedBudget = predictedExpense > monthlyBudget;
            const projectedOverflow = predictedExpense - monthlyBudget;

            res.status(200).json({
                success: true,
                prediction: {
                    predictedExpense: predictedExpense.toFixed(2),
                    monthlyBudget,
                    willExceedBudget,
                    projectedOverflow: projectedOverflow > 0 ? projectedOverflow.toFixed(2) : 0,
                    confidence: 'High',
                    recommendation: willExceedBudget 
                        ? `Based on your spending patterns, you're likely to spend ₹${predictedExpense.toFixed(2)} this month, exceeding your budget by ₹${projectedOverflow.toFixed(2)}. Reduce spending by ${((projectedOverflow / predictedExpense) * 100).toFixed(1)}%.`
                        : `Based on your spending patterns, you'll likely spend ₹${predictedExpense.toFixed(2)} this month, staying within budget with ₹${(monthlyBudget - predictedExpense).toFixed(2)} remaining.`
                }
            });
        } catch (mlError) {
            // If ML API is not available, return statistical prediction
            const avgExpense = expenseHistory.reduce((a, b) => a + b, 0) / expenseHistory.length;
            const willExceedBudget = avgExpense > monthlyBudget;

            res.status(200).json({
                success: true,
                prediction: {
                    predictedExpense: avgExpense.toFixed(2),
                    monthlyBudget,
                    willExceedBudget,
                    projectedOverflow: willExceedBudget ? (avgExpense - monthlyBudget).toFixed(2) : 0,
                    confidence: 'Medium',
                    recommendation: willExceedBudget 
                        ? `Based on your average spending, you're likely to spend ₹${avgExpense.toFixed(2)} this month. Consider reducing expenses.`
                        : `Based on your spending trends, you're on track to stay within budget.`,
                    note: 'Statistical prediction (ML model not available)'
                }
            });
        }
    } catch (error) {
        console.error('Predict Budget Overflow Error:', error);
        res.status(500).json({ message: 'Error predicting budget overflow', error: error.message });
    }
};
