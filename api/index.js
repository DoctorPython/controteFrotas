// Vercel Serverless Function Entrypoint
const app = require('../dist/index.cjs');

// Suporte tanto para export default quanto module.exports direto
module.exports = app.default || app;
