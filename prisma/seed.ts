import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Create Super Admin
    const adminPassword = await bcrypt.hash('manager123', 10)
    const superAdmin = await prisma.user.upsert({
        where: { email: 'manager@meenuin.com' },
        update: {},
        create: {
            name: 'Manager Meenuin',
            email: 'manager@meenuin.com',
            password: adminPassword,
            role: 'SUPER_ADMIN',
        },
    })
    console.log({ superAdmin })

    // 1b. Create Permanent Real Super Admin
    const realSuperAdminPassword = await bcrypt.hash('superadmin123', 10)
    const realSuperAdmin = await prisma.user.upsert({
        where: { email: 'super@meenuin.biz.id' },
        update: {
            password: realSuperAdminPassword // Ensure password is set/reset on seed
        },
        create: {
            name: 'Super Admin Utama',
            email: 'super@meenuin.biz.id',
            password: realSuperAdminPassword,
            role: 'SUPER_ADMIN',
        },
    })
    console.log({ realSuperAdmin })

    console.log('Seed: Super admins fixed.')

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
