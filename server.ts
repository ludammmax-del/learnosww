import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/apiRouter.ts';

process.on('unhandledRejection', (reason) => {
  console.warn('[Server Unhandled Rejection Caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception Caught]:', err?.message || err);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Endpoints mounted on real Express application
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Learning OS server running on http://0.0.0.0:${PORT}`);
  });
  server.setTimeout(240000);
  server.headersTimeout = 240000;
  server.requestTimeout = 240000;
}

startServer();
