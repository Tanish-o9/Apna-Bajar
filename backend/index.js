/**
 * Root entry point for Vercel Serverless Function & Zero-Config deployment
 */
const app = require('./server');

module.exports = app;
module.exports.default = app;
