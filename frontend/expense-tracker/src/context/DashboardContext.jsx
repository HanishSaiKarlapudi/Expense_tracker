import React, { createContext, useState } from 'react';
import axios from 'axios';

export const DashboardContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with interceptor
const axiosInstance = axios.create({
    baseURL: API_BASE
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const DashboardProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);
    const [income, setIncome] = useState([]);
    const [summary, setSummary] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch dashboard summary
    const fetchSummary = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/dashboard/summary`);
            setSummary(response.data.summary);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch summary');
        } finally {
            setLoading(false);
        }
    };

    // Fetch expenses
    const fetchExpenses = async (month, year) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/expense/monthly`, {
                params: { month, year }
            });
            setExpenses(response.data.expenses);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    // Fetch income
    const fetchIncome = async (month, year) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/income/monthly`, {
                params: { month, year }
            });
            setIncome(response.data.income);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch income');
        } finally {
            setLoading(false);
        }
    };

    // Create expense
    const createExpense = async (expenseData) => {
        try {
            setLoading(true);
            console.log('Creating expense with data:', expenseData);
            const response = await axiosInstance.post(`/expense/create`, expenseData);
            console.log('Expense created successfully:', response.data);
            setExpenses([...expenses, response.data.expense]);
            await fetchSummary();
            setError(null);
            return response.data;
        } catch (err) {
            console.error('Error creating expense:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to create expense';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Create income
    const createIncome = async (incomeData) => {
        try {
            setLoading(true);
            const response = await axiosInstance.post(`/income/create`, incomeData);
            setIncome([...income, response.data.income]);
            await fetchSummary();
            setError(null);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create income');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Update expense
    const updateExpense = async (id, expenseData) => {
        try {
            setLoading(true);
            const response = await axiosInstance.put(`/expense/${id}`, expenseData);
            setExpenses(expenses.map(exp => exp._id === id ? response.data.expense : exp));
            await fetchSummary();
            setError(null);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update expense');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Delete expense
    const deleteExpense = async (id) => {
        try {
            setLoading(true);
            await axiosInstance.delete(`/expense/${id}`);
            setExpenses(expenses.filter(exp => exp._id !== id));
            await fetchSummary();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete expense');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Delete income
    const deleteIncome = async (id) => {
        try {
            setLoading(true);
            await axiosInstance.delete(`/income/${id}`);
            setIncome(income.filter(inc => inc._id !== id));
            await fetchSummary();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete income');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Fetch suggestions
    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/dashboard/suggestions`);
            setSuggestions(response.data.suggestions);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch suggestions');
        } finally {
            setLoading(false);
        }
    };

    // Fetch monthly data
    const fetchMonthlyData = async (months = 6) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/dashboard/monthly-expenses`, {
                params: { months }
            });
            setMonthlyData(response.data.monthlyData);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch monthly data');
        } finally {
            setLoading(false);
        }
    };

    // Predict budget overflow
    const predictBudgetOverflow = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/dashboard/predict-overflow`);
            setPrediction(response.data.prediction);
            setError(null);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to predict budget overflow');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardContext.Provider value={{
            expenses,
            income,
            summary,
            suggestions,
            monthlyData,
            prediction,
            loading,
            error,
            fetchSummary,
            fetchExpenses,
            fetchIncome,
            createExpense,
            createIncome,
            updateExpense,
            deleteExpense,
            deleteIncome,
            fetchSuggestions,
            fetchMonthlyData,
            predictBudgetOverflow
        }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = React.useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
