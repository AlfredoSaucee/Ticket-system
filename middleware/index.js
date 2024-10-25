/**
 * General middleware.
 */
"use strict";

/**
 * Log incoming requests to console to see who accesses the server
 * on what route.
 *
 * @param {Request}  req  The incoming request.
 * @param {Response} res  The outgoing response.
 * @param {Function} next Next to call in chain of middleware.
 *
 * @returns {void}
 */
function logIncomingToConsole(req, res, next) {
    console.info(`Got request on ${req.path} (${req.method}).`);
    next();
}

// Middleware to check the role of the user before letting them access the route.
function checkAgentRole(req, res, next) {
    if (req.session && req.session.roles && req.session.roles.includes('agent')) {
        return next();
    } else {
        return res.status(403).send('Access denied. You do not have permission to view this page.');
    }
}

module.exports = {
    logIncomingToConsole: logIncomingToConsole,
    checkAgentRole: checkAgentRole,
};