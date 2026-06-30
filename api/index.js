/**
 * Vercel Serverless Entry Point
 * Wraps the Express app for Vercel's Node.js runtime
 */
const app = require('../backend/src/app')

module.exports = app