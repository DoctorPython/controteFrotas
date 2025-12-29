import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  // Suporte para ESM e CJS
  const currentDir = typeof __dirname !== 'undefined' 
    ? __dirname 
    : path.dirname(fileURLToPath(import.meta.url));
  
  // Em produção, os arquivos estão em dist/public
  // O arquivo compilado (dist/index.cjs) está em dist/, então public está no mesmo nível
  let distPath = path.resolve(currentDir, "public");
  
  // Fallback: se não encontrar, tenta o caminho absoluto do projeto
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(process.cwd(), "dist", "public");
  }
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
