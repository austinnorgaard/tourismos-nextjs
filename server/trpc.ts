import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { verifyToken } from './jwt';
import type { User } from '../drizzle/schema';

interface Context {
  user: User | null;
}

export async function createContext(req: Request): Promise<Context> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return { user: null };

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=');
      return [key, v.join('=')];
    })
  );

  const token = cookies['session'];
  if (!token) return { user: null };

  try {
    const user = await verifyToken(token);
    return { user };
  } catch {
    return { user: null };
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
