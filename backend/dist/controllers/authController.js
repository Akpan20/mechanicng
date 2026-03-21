"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
// src/controllers/authController.ts
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const jwt_1 = require("../lib/jwt");
const nodemailer_1 = __importDefault(require("nodemailer"));
// ─── Schemas ──────────────────────────────────────────────────
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(254).toLowerCase(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').max(128),
    fullName: zod_1.z.string().min(2, 'Full name required').max(100),
    role: zod_1.z.enum(['user', 'mechanic']).default('user'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(254).toLowerCase(),
    password: zod_1.z.string().min(1).max(128),
});
const updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(100).optional(),
    avatarUrl: zod_1.z.string().url().max(500).optional(),
}).strict();
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(254).toLowerCase(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').max(128),
});
// ─── Helpers ──────────────────────────────────────────────────
function serializeUser(user) {
    return {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        mechanicId: user.mechanicId,
    };
}
function hashToken(raw) {
    return crypto_1.default.createHash('sha256').update(raw).digest('hex');
}
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// ─── Auth ─────────────────────────────────────────────────────
async function signup(req, res) {
    try {
        const body = signupSchema.parse(req.body);
        const exists = await User_1.User.findOne({ email: body.email });
        if (exists) {
            // Generic message — don't confirm whether email exists
            res.status(409).json({ error: 'Unable to create account with these details' });
            return;
        }
        const user = await User_1.User.create(body);
        const token = (0, jwt_1.signToken)({ userId: user._id.toString(), email: user.email, role: user.role });
        res.status(201).json({ token, user: serializeUser(user) });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        console.error('signup error:', err);
        res.status(500).json({ error: 'Failed to create account' });
    }
}
async function login(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const user = await User_1.User.findOne({ email: body.email }).select('+password');
        // Always run comparePassword even if user not found
        // prevents timing attacks that reveal valid emails
        const passwordValid = user
            ? await user.comparePassword(body.password)
            : await bcryptDummy();
        if (!user || !passwordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const token = (0, jwt_1.signToken)({ userId: user._id.toString(), email: user.email, role: user.role });
        res.json({ token, user: serializeUser(user) });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        console.error('login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
}
async function getMe(req, res) {
    try {
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(serializeUser(user));
    }
    catch (err) {
        console.error('getMe error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}
async function updateMe(req, res) {
    try {
        const updates = updateProfileSchema.parse(req.body);
        const user = await User_1.User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true, runValidators: true });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(serializeUser(user));
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        console.error('updateMe error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}
// ─── Password reset ───────────────────────────────────────────
async function forgotPassword(req, res) {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await User_1.User.findOne({ email });
        // Always respond with the same message whether email exists or not
        // This prevents email enumeration
        const GENERIC = 'If that email is registered, a reset link has been sent';
        if (user) {
            const rawToken = crypto_1.default.randomBytes(32).toString('hex');
            const hashedToken = hashToken(rawToken);
            user.resetToken = hashedToken;
            user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save({ validateBeforeSave: false });
            const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: user.email,
                    subject: 'MechanicNG — Password Reset',
                    html: `
            <p>Hi ${user.fullName},</p>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in <strong>1 hour</strong>.</p>
            <p>If you did not request this, ignore this email — your password has not changed.</p>
          `,
                });
            }
            catch (mailErr) {
                // Don't leak mail errors to the client — just log them
                console.error('Password reset email failed:', mailErr);
                // Clear the token so it can be retried
                user.resetToken = undefined;
                user.resetTokenExpiry = undefined;
                await user.save({ validateBeforeSave: false });
                res.status(500).json({ error: 'Failed to send reset email' });
                return;
            }
        }
        res.json({ message: GENERIC });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        console.error('forgotPassword error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
}
async function resetPassword(req, res) {
    try {
        const { token, password } = resetPasswordSchema.parse(req.body);
        const hashedToken = hashToken(token);
        const user = await User_1.User.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: new Date() }, // not expired
        }).select('+password +resetToken +resetTokenExpiry');
        if (!user) {
            res.status(400).json({ error: 'Reset link is invalid or has expired' });
            return;
        }
        // Set new password and clear reset token — single use
        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        // Issue a new login token so user is logged in immediately
        const authToken = (0, jwt_1.signToken)({ userId: user._id.toString(), email: user.email, role: user.role });
        res.json({ message: 'Password reset successful', token: authToken, user: serializeUser(user) });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        console.error('resetPassword error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
}
// ─── Timing attack dummy ──────────────────────────────────────
// Runs a bcrypt compare against a fake hash when user is not found
// so response time is identical whether the email exists or not
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DUMMY_HASH = '$2a$12$dummyhashfortimingattackpreventiononlyxxxxxxxxxxxxxxxx';
async function bcryptDummy() {
    await bcryptjs_1.default.compare('dummy', DUMMY_HASH);
    return false;
}
