"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const isDev = process.env.NODE_ENV !== 'production';
function errorHandler(err, _req, res, _next) {
    console.error(err.stack);
    const status = err.status || 500;
    const message = isDev ? err.message : 'An unexpected error occurred';
    res.status(status).json({ error: message });
}
