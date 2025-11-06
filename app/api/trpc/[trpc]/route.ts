import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/index';
import { createContext } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    // createContext expects a RequestLike; pass a thin adapter from the Fetch Request
    createContext: () => createContext({ headers: req.headers as unknown as Record<string, string> | { get?: (name: string) => string | undefined }, res: undefined }),
  });

export { handler as GET, handler as POST };
