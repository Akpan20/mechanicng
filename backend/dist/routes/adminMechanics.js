"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Mechanic_1 = require("../models/Mechanic");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/admin/mechanics?city=&service=&status=&limit=&page=
router.get("/mechanics", auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { city, service, status } = req.query;
        const limit = Math.max(1, Math.min(200, Number(req.query.limit ?? 50)));
        const page = Math.max(1, Number(req.query.page ?? 1));
        const filter = {};
        if (city)
            filter.$or = [
                { city: new RegExp(String(city), "i") },
                { area: new RegExp(String(city), "i") },
            ];
        if (service)
            filter.services = service;
        if (status)
            filter.status = status;
        const total = await Mechanic_1.Mechanic.countDocuments(filter);
        const mechanics = await Mechanic_1.Mechanic.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.json({
            mechanics: mechanics.map((m) => ({ ...m, id: m._id })),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/admin/mechanics/:id/status
router.patch("/mechanics/:id/status", auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["pending", "approved", "rejected", "suspended"];
        if (!allowed.includes(status)) {
            res.status(400).json({ error: "Invalid status" });
            return;
        }
        const m = await Mechanic_1.Mechanic.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!m) {
            res.status(404).json({ error: "Mechanic not found" });
            return;
        }
        res.json({ success: true, status: m.status });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
