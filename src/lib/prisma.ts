import { PrismaClient } from '@prisma/client'

const getDbUrl = (): string | undefined => {
    let url = process.env.DATABASE_URL;
    if (url && url.includes('pooler.supabase.com') && !url.includes('pgbouncer=true')) {
        url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    return url;
};

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: { url: getDbUrl() }
        }
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
