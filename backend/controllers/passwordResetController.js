const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email configuration
let transporter;

const initEmailService = () => {
    if (process.env.EMAIL_SERVICE === 'gmail') {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_PASSWORD
            }
        });
    } else if (process.env.EMAIL_SERVICE === 'ethereal') {
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.ETHEREAL_EMAIL,
                pass: process.env.ETHEREAL_PASSWORD
            }
        });
    } else if (process.env.SENDGRID_API_KEY) {
        const sgTransport = require('nodemailer-sendgrid-transport');
        transporter = nodemailer.createTransport(
            sgTransport({
                auth: {
                    api_key: process.env.SENDGRID_API_KEY
                }
            })
        );
    }
};

initEmailService();

// Forgot Password - Send Reset Email
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Please provide email address' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            // Don't reveal if email exists (security best practice)
            return res.status(200).json({ 
                message: 'If an account exists, password reset email has been sent' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Create reset record with 1-hour expiry
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour
        
        await PasswordReset.create({
            userId: user._id,
            email: user.email,
            resetToken: hashedToken,
            expiresAt
        });

        // Create reset link
        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`;

        // Send email
        const mailOptions = {
            from: process.env.GMAIL_EMAIL || 'noreply@expensetracker.com',
            to: user.email,
            subject: 'Password Reset Request - Expense Tracker',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.fullName},</p>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
                    Reset Your Password
                </a>
                <p>Or copy this link: ${resetLink}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this, ignore this email.</p>
                <hr>
                <p>Expense Tracker Team</p>
            `
        };

        if (transporter) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log('Email service not configured. Reset link:', resetLink);
            return res.status(500).json({ message: 'Email service not configured' });
        }

        res.status(200).json({ 
            message: 'Password reset email sent successfully' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            message: 'Error sending reset email', 
            error: error.message 
        });
    }
};

// Reset Password - Update Password with Token
exports.resetPassword = async (req, res) => {
    const { token, email, newPassword, confirmPassword } = req.body;

    try {
        if (!token || !email || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // Hash the provided token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset record
        const resetRecord = await PasswordReset.findOne({
            resetToken: hashedToken,
            email: email,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token' 
            });
        }

        // Find user and update password
        const user = await User.findById(resetRecord.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password (will be hashed before save by User model middleware)
        user.password = newPassword;
        await user.save();

        // Mark reset token as used
        resetRecord.used = true;
        await resetRecord.save();

        res.status(200).json({ 
            message: 'Password reset successfully. You can now login with your new password.' 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            message: 'Error resetting password', 
            error: error.message 
        });
    }
};

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
    const { token, email } = req.query;

    try {
        if (!token || !email) {
            return res.status(400).json({ valid: false, message: 'Missing token or email' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetRecord = await PasswordReset.findOne({
            resetToken: hashedToken,
            email: email,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return res.status(200).json({ 
                valid: false, 
                message: 'Invalid or expired reset token' 
            });
        }

        res.status(200).json({ 
            valid: true, 
            message: 'Token is valid' 
        });

    } catch (error) {
        res.status(500).json({ 
            valid: false, 
            message: 'Error verifying token' 
        });
    }
};
