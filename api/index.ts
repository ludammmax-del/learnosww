import express from 'express';
import type { Request, Response } from 'express';

type ExpressApp = ReturnType<typeof express>;

let appPromise: Promise<ExpressApp> | null = null;

function getApp(): Promise<ExpressApp> {
	if (!appPromise) {
		appPromise = import('../server/apiRouter.ts')
			.then(({ apiRouter }) => {
				const app = express();
				app.use(express.json({ limit: '10mb' }));
				app.use(express.urlencoded({ extended: true, limit: '10mb' }));

				// Vercel may pass the original URL or a path with the /api prefix removed.
				app.use('/api', apiRouter);
				app.use('/', apiRouter);
				return app;
			})
			.catch((error) => {
				appPromise = null;
				throw error;
			});
	}
	return appPromise;
}

export default async function handler(req: Request, res: Response) {
	try {
		const app = await getApp();
		return app(req, res);
	} catch (error) {
		console.error('[Vercel API] Failed to initialize routes:', error);
		if (!res.headersSent) {
			return res.status(500).json({ error: 'API_INITIALIZATION_FAILED' });
		}
		return res.end();
	}
}
