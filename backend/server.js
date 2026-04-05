require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path  = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');

const app = express();

//middleware
app.use(cors(
    {
        origin: function(origin, callback) {
            // Allow localhost on any port for development
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
));

app.use(express.json());

connectDB();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/password', passwordResetRoutes);
app.use('/api/v1/expense', expenseRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check route
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// app.use(express.static(path.join(__dirname, 'public')));