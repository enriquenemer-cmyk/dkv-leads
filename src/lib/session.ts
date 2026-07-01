import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { SessionOptions } from 'iron-session'

export interface SessionData {
  email: string
  role: 'admin' | 'asesor'
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'dkv-session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
