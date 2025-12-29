import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Em CJS compilado, __dirname aponta para o diretório do arquivo dist/index.cjs
  // Tentamos múltiplos caminhos para encontrar a pasta public
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"),
  ];
  
  let distPath = possiblePaths.find(p => fs.existsSync(p));
  
  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}. Make sure to build the client first.`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
