"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const User_1 = require("../models/User");
const jwt_1 = require("../lib/jwt");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fullName: zod_1.z.string().min(2),
    role: zod_1.z.enum(["user", "mechanic"]).default("user"),
});
const adminSignupSchema = signupSchema.extend({
    adminSecret: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    fullName: zod_1.z.string().min(2).optional(),
    adminSecret: zod_1.z.string().optional(),
});
// POST /api/auth/signup
router.post("/signup", async (req, res) => {
    try {
        const body = signupSchema.parse(req.body);
        const exists = await User_1.User.findOne({ email: body.email });
        if (exists) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const user = await User_1.User.create(body);
        const token = (0, jwt_1.signToken)({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
});
// POST /api/auth/admin/signup
router.post("/admin/signup", async (req, res) => {
    try {
        const body = adminSignupSchema.parse(req.body);
        const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "dev-admin-secret";
        if (body.adminSecret !== ADMIN_SECRET) {
            res.status(401).json({ error: "Invalid admin secret" });
            return;
        }
        const exists = await User_1.User.findOne({ email: body.email });
        if (exists) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const user = await User_1.User.create({
            email: body.email,
            password: body.password,
            fullName: body.fullName,
            role: "admin",
        });
        const token = (0, jwt_1.signToken)({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
});
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const body = loginSchema.parse(req.body);
        let user = await User_1.User.findOne({ email: body.email }).select("+password");
        // If no user found, allow creating the initial admin account when there are
        // no admins in the system and the correct admin secret is supplied.
        if (!user) {
            const adminCount = await User_1.User.countDocuments({ role: "admin" });
            if (adminCount === 0) {
                const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "dev-admin-secret";
                if (!body.adminSecret || body.adminSecret !== ADMIN_SECRET) {
                    res.status(401).json({ error: "Invalid email or password" });
                    return;
                }
                if (!body.fullName) {
                    res
                        .status(400)
                        .json({ error: "fullName is required to create initial admin" });
                    return;
                }
                user = await User_1.User.create({
                    email: body.email,
                    password: body.password,
                    fullName: body.fullName,
                    role: "admin",
                });
            }
            else {
                res.status(401).json({ error: "Invalid email or password" });
                return;
            }
        }
        else {
            if (!(await user.comparePassword(body.password))) {
                res.status(401).json({ error: "Invalid email or password" });
                return;
            }
        }
        const token = (0, jwt_1.signToken)({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.errors });
            return;
        }
        res.status(500).json({ error: err.message });
    }
});
// GET /api/auth/me
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            avatarUrl: user.avatarUrl,
            mechanicId: user.mechanicId,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/auth/me
router.patch("/me", auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findByIdAndUpdate(req.user.userId, {
            $set: { fullName: req.body.fullName, avatarUrl: req.body.avatarUrl },
        }, { new: true });
        res.json({
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
