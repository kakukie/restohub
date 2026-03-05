import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getDbUrl = (): string | undefined => {
  let url = process.env.DATABASE_URL;
  if (url && url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }
  return url;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: { url: getDbUrl() }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db