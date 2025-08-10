// import express, { type Express } from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Emulate __dirname in ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const setupVite = async (app: Express) => {
//   // Serve static files from client build
//   app.use(express.static(path.join(__dirname, '../../dist/client')));
// };

// export const serveStatic = (staticPath: string) => {
//   return express.static(staticPath);
// };

// export const log = console.log;
import express, { type Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupVite = async (app: Express) => {
  const clientDistPath = path.join(__dirname, '../../dist/client');

  // Serve static assets
  app.use(express.static(clientDistPath));

  // SPA fallback: serve index.html for all unmatched routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
};

export const serveStatic = (staticPath: string) => {
  return express.static(staticPath);
};

export const log = console.log;
