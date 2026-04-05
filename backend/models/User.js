const mongoose = require('mongoose');

const bcrypt = require('bcryptjs'); 

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },    
    email : {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profileImageUrl: {
        type: String,
        default: null
    },
    monthlyBudget: {
        type: Number,
        default: 5000,
        min: 0
    },
    budgetAlertThreshold: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
    }
}, { timestamps: true });

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10); 
    next();
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model('User', UserSchema);