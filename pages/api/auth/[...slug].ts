import type { NextApiRequest, NextApiResponse } from 'next';
import oauthRouter from '@/server/oauth';

// Disable Next's body parser for OAuth callbacks (Apple may post a form)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Forward the request to the Express router exported by server/oauth
  // The Express router is a function (req, res, next) so we can call it directly.
  try {
     
    (oauthRouter as any)(req, res, (err?: unknown) => {
      if (err) {
        console.error('[API_AUTH] Error in OAuth router adapter:', err);
        res.status(500).end('Internal Server Error');
      } else {
        // If router didn't handle the request, return 404
        res.status(404).end('Not Found');
      }
    });
  } catch (err) {
    console.error('[API_AUTH] Exception while proxying to OAuth router:', err);
    res.status(500).end('Internal Server Error');
  }
}
