// Vercel Serverless Function Entrypoint
// Importa o app Express compilado em CJS
const appModule = require('../dist/index.cjs');
const app = appModule.default || appModule;

// Exporta um handler no formato esperado pelo @vercel/node
// Encaminha a requisição diretamente para o Express
module.exports = (req, res) => {
  return app(req, res);
};
