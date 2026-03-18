"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.getMe = getMe;
exports.updateMe = updateMe;
const zod_1 = require("zod");
const User_1 = require("../models/User");
const jwt_1 = require("../lib/jwt");
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    fullName: zod_1.z.string().min(2, 'Full name required'),
    role: zod_1.z.enum(['user', 'mechanic']).default('user'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
}).strict();
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
async function signup(req, res) {
    try {
        const body = signupSchema.parse(req.body);
        const exists = await User_1.User.findOne({ email: body.email });
        if (exists) {
            res.status(409).json({ error: 'Email already registered' });
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
        res.status(500).json({ error: err.message });
    }
}
async function login(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const user = await User_1.User.findOne({ email: body.email }).select('+password');
        if (!user || !(await user.comparePassword(body.password))) {
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
}
