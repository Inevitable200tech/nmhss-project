import dotenv from "dotenv";

import express, { type Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

dotenv.config({ path: "cert.env" }); // Adjust the path if your .env is elsewhere

log("Starting server initialization…");
log(`Loaded environment variables: MONGO_URL=${process.env.MONGO_URL}, PORT=${process.env.PORT}`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/schoolconnect";
  log(`Attempting MongoDB connection to: ${mongoUrl}`);
  try {
    await mongoose.connect(mongoUrl);
    log(`Connected to MongoDB at ${mongoUrl}`);
  } catch (err) {
    log(`Failed to connect to MongoDB: ${(err instanceof Error ? err.message : String(err))}`);
    log("Exiting process due to MongoDB connection failure.");
    process.exit(1);
  }

  log("Registering routes…");
  const server = await registerRoutes(app);
  log("Routes registered.");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    log(`Error encountered: ${err.message || err}`);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    log("Setting up Vite for development…");
    await setupVite(app, server);
    log("Vite setup complete.");
  } else {
    log("Serving static files for production…");
    serveStatic(app);
    log("Static file serving setup complete.");
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  log(`Starting server on port ${port}…`);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server is running and serving on port ${port}`);
  });
})();