import { SignJWT, jwtVerify } from 'jose';
import { getUserByOpenId } from './db';
import type { User } from '../drizzle/schema';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function generateToken(openId: string): Promise<string> {
  return await new SignJWT({ openId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<User> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const user = await getUserByOpenId(payload.openId as string);
  if (!user) throw new Error('User not found');
  return user;
}
