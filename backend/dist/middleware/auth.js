"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMechanic = exports.requireAdmin = void 0;
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    try {
        req.user = (0, jwt_1.verifyToken)(header.slice(7));
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    };
}
exports.requireAdmin = requireRole('admin');
exports.requireMechanic = requireRole('mechanic', 'admin');
