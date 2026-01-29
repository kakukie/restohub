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

    // 2. Create Demo Restaurant Admin
    const restoPassword = await bcrypt.hash('resto123', 10)
    const restoAdmin = await prisma.user.upsert({
        where: { email: 'resto@admin.com' },
        update: {},
        create: {
            name: 'Resto Admin 1',
            email: 'resto@admin.com',
            password: restoPassword,
            role: 'RESTAURANT_ADMIN',
        },
    })

    // 3. Create Demo Restaurant
    const restaurant = await prisma.restaurant.upsert({
        where: { id: '1' }, // Hardcode ID for consistency
        update: {},
        create: {
            id: '1',
            name: 'Warung Rasa Nusantara',
            description: 'Authentic Indonesian cuisine',
            address: 'Jl. Merdeka No. 1, Jakarta',
            phone: '08123456781',
            package: 'PRO',
            adminId: restoAdmin.id,
            email: 'indo@admin.com',
            status: 'ACTIVE',
            slug: 'warung-rasa-nusantara',
            isActive: true,
        },
    })

    // 4. Create Categories
    const catMain = await prisma.category.create({
        data: { name: 'Main Course', displayOrder: 1, restaurantId: restaurant.id }
    })
    const catBev = await prisma.category.create({
        data: { name: 'Beverage', displayOrder: 2, restaurantId: restaurant.id }
    })

    // 5. Create Menu Items
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Nasi Goreng Spesial',
                description: 'Fried rice with special spices',
                price: 35000,
                categoryId: catMain.id,
                restaurantId: restaurant.id,
                isBestSeller: true,
                isRecommended: true
            },
            {
                name: 'Sate Ayam',
                description: 'Grilled chicken skewers',
                price: 25000,
                categoryId: catMain.id, // Simplifying for demo
                restaurantId: restaurant.id,
                isBestSeller: true
            },
            {
                name: 'Es Teh Manis',
                description: 'Sweet iced tea',
                price: 8000,
                categoryId: catBev.id,
                restaurantId: restaurant.id
            }
        ]
    })

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
