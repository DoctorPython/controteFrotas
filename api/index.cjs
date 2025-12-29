// Vercel Serverless Function Entrypoint
// Importa o app Express compilado em CJS
const appModule = require('../dist/index.cjs');
const app = appModule.default || appModule;
const appReady = appModule.appReady;

// Exporta um handler no formato esperado pelo @vercel/node
// Aguarda a inicialização do app antes de processar requisições
module.exports = async (req, res) => {
  // Aguarda o app estar completamente inicializado
  if (appReady) {
    await appReady;
  }
  return app(req, res);
};
