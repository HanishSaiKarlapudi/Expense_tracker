const User = require('../models/User');
const jwt = require('jsonwebtoken');


//generation of token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}

// Register user
exports.registerUser = async (req, res) => {
    const {fullName, email, password, profileImageUrl} = req.body;

    // Validation: Check if all fields are provided
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // check if email already exists    
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Create new user
        const user = await User.create({ fullName, email, password, profileImageUrl });
        res.status(201).json({ 
           id: user._id,
           user,
              token: generateToken(user._id)
        });
    } catch (error) {
        res
            .status(500)    
            .json({ message: 'error registering user', error: error.message });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isPasswordMatch = await user.comparePassword(password);
        
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({
            id: user._id,
            user,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Get user info
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            id: user._id,
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Update user budget
exports.updateBudget = async (req, res) => {
    const { monthlyBudget, budgetAlertThreshold } = req.body;

    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (monthlyBudget !== undefined) {
            user.monthlyBudget = monthlyBudget;
        }
        
        if (budgetAlertThreshold !== undefined) {
            user.budgetAlertThreshold = budgetAlertThreshold;
        }

        await user.save();

        res.status(200).json({
            message: 'Budget updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating budget', error: error.message });
    }
};

// Update user profile (name, email, profile picture)
exports.updateProfile = async (req, res) => {
    const { fullName, email, profileImageUrl } = req.body;

    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate inputs
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: 'Full name is required' });
        }

        // Check if email is being changed to an existing email
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        user.fullName = fullName.trim();
        
        if (profileImageUrl) {
            user.profileImageUrl = profileImageUrl;
        }

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};