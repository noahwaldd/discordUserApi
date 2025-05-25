import { pathToFileURL } from "url";
import "colors";
import fs from "fs";
import path from "path";
import pkg from "express";

const { Router } = pkg;

const getDirname = (metaUrl) => {
  const __filename = new URL(metaUrl).pathname;
  const platformAdjustedFilename = process.platform === "win32" ? __filename.substring(1) : __filename;
  return path.dirname(platformAdjustedFilename);
};

async function registerRoutes(app) {
  const __dirname = getDirname(import.meta.url);

  const routesPath = path.join(decodeURI(__dirname), "routes");
  const routesFiles = fs.readdirSync(routesPath);

  console.log("\n[🏹 API Routes]".bgYellow, `Iniciando registro de ${routesFiles.length} rotas...`.yellow);

  for (const file of routesFiles) {
    const routeFilePath = path.join(routesPath, file);
    const routeFileURL = pathToFileURL(routeFilePath).href;
    const routeModule = await import(routeFileURL);
    const { method, name, execute } = routeModule;
    app[method](name, execute);
    console.log(`[✓] Rota registrada: ${method.toUpperCase()} ${name}`.green);
  }

  app.use((req, res) => {
    res.status(404).json({ status: 404, message: "Rota inválida." });
  });

  console.log("[🏹 API Routes]".bgYellow, "Registro de rotas concluído!".yellow + "\n");
}

export default registerRoutes;