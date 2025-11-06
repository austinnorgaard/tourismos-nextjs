import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { verifyToken } from './jwt';
import type { User } from '../drizzle/schema';

export interface Context {
  user: User | null;
  // Optional request/response to support code that expects express-like ctx.req/ctx.res
  req?: unknown;
  res?: unknown;
}

type RequestLike = {
  headers?: Record<string, string> | { get?: (name: string) => string | undefined };
  res?: unknown;
};

export async function createContext(req?: RequestLike): Promise<Context> {
  if (!req) return { user: null };

  // Support both Express-like and Fetch-like request objects
  function getCookieHeader(headers?: RequestLike['headers']): string | undefined {
    if (!headers) return undefined;
    // Express-like headers: Record<string, string>
    if (typeof (headers as Record<string, string>).cookie === 'string') {
      return (headers as Record<string, string>).cookie;
    }
    // Fetch-like Headers object
    const maybeGet = (headers as { get?: (name: string) => string | undefined }).get;
    if (typeof maybeGet === 'function') {
      return maybeGet.call(headers, 'cookie');
    }
    return undefined;
  }

  const cookieHeader = getCookieHeader(req.headers);
  if (!cookieHeader) return { user: null, req, res: (req.res || undefined) };

  const cookies = Object.fromEntries(
    (cookieHeader as string).split('; ').map((c: string) => {
      const [key, ...v] = c.split('=');
      return [key, v.join('=')];
    })
  );

  const token = cookies['session'];
  if (!token) return { user: null, req, res: (req.res || undefined) };

  try {
    const user = await verifyToken(token);
    return { user, req, res: (req.res || undefined) };
  } catch {
    return { user: null, req, res: (req.res || undefined) };
  }
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});
