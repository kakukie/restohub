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

    // 2. Create Subscription Plans
    const plans = [
        {
            id: 'BASIC',
            name: 'Basic',
            description: 'Perfect for small restaurants',
            price: 99000,
            menuLimit: 50,
            features: ['50 Menu Items', 'Basic Analytics', 'Email Support', 'QR Code Generation', 'Digital Menu'],
            isActive: true
        },
        {
            id: 'PRO',
            name: 'Pro',
            description: 'For growing businesses',
            price: 199000,
            menuLimit: 100,
            features: ['100 Menu Items', 'Advanced Analytics', 'Priority Support', 'QR Code Generation', 'Custom Branding', 'Digital Menu'],
            isActive: true
        },
        {
            id: 'ENTERPRISE',
            name: 'Enterprise',
            description: 'For large operations',
            price: 499000,
            menuLimit: 200,
            features: ['200 Menu Items', 'Full Analytics', '24/7 Support', 'QR Code Generation', 'Custom Branding', 'API Access', 'Multi-location', 'Digital Menu'],
            isActive: true
        }
    ]

    for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
            where: { id: plan.id },
            update: {
                name: plan.name,
                description: plan.description,
                price: plan.price,
                menuLimit: plan.menuLimit,
                features: plan.features,
                isActive: plan.isActive
            },
            create: plan,
        })
    }
    console.log('Seed: Subscription Plans fixed.')

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
