/**
 * DEMO SEED SCRIPT — for client demo / simulation
 * Creates: 1 demo restaurant admin + restaurant + categories + menu items
 *          + payment methods + sample orders (with payments)
 *
 * ⚠️  SUPABASE NOTE: This script requires a DIRECT connection (not via pgBouncer).
 *     Set DIRECT_URL in your .env — this script will auto-use it.
 *     OR run via: npm run db:seed-demo
 */

import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethodType } from '@prisma/client'
import bcrypt from 'bcryptjs'

// ─── Supabase / pgBouncer compatibility ──────────────────────────────────────
// Supabase's pooled connection (DATABASE_URL) doesn't support all Prisma
// operations. For seeding, we must use the direct URL.
if (process.env.DIRECT_URL && process.env.DATABASE_URL !== process.env.DIRECT_URL) {
    console.log('🔀 Supabase detected — switching to DIRECT_URL for seeding...')
    process.env.DATABASE_URL = process.env.DIRECT_URL
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
    }
})

// ─── Utility ────────────────────────────────────────────────────────────────
function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
function randItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}
function daysAgo(n: number) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
}

async function main() {
    console.log('\n🌱 Starting DEMO seed...\n')

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Demo Restaurant Admin
    // ──────────────────────────────────────────────────────────────────────────
    const adminPassword = await bcrypt.hash('demo1234', 10)
    const demoAdmin = await prisma.user.upsert({
        where: { email: 'demo@restohub.id' },
        update: { password: adminPassword },
        create: {
            name: 'Demo Restaurant Manager',
            email: 'demo@restohub.id',
            password: adminPassword,
            phone: '08123456789',
            role: 'RESTAURANT_ADMIN',
        },
    })
    console.log(`✅ Admin: ${demoAdmin.email} / demo1234`)

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Demo Restaurant
    // ──────────────────────────────────────────────────────────────────────────
    const restaurant = await prisma.restaurant.upsert({
        where: { slug: 'warung-nusantara-demo' },
        update: {
            name: 'Warung Nusantara',
            description: 'Restoran masakan Indonesia autentik dengan cita rasa tradisional. Demo akun untuk simulasi fitur.',
            address: 'Jl. Sudirman No. 45, Jakarta Pusat, DKI Jakarta',
            phone: '021-55512345',
            email: 'warung@nusantara.id',
            theme: 'modern-emerald',
            package: 'PRO',
            status: 'ACTIVE',
            isActive: true,
            maxMenuItems: 100,
            maxCategories: 20,
            allowMaps: true,
            enableAnalytics: true,
        },
        create: {
            name: 'Warung Nusantara',
            description: 'Restoran masakan Indonesia autentik dengan cita rasa tradisional. Demo akun untuk simulasi fitur.',
            address: 'Jl. Sudirman No. 45, Jakarta Pusat, DKI Jakarta',
            phone: '021-55512345',
            email: 'warung@nusantara.id',
            theme: 'modern-emerald',
            slug: 'warung-nusantara-demo',
            package: 'PRO',
            status: 'ACTIVE',
            isActive: true,
            maxMenuItems: 100,
            maxCategories: 20,
            allowMaps: true,
            enableAnalytics: true,
            adminId: demoAdmin.id,
        },
    })
    console.log(`✅ Restaurant: ${restaurant.name} (slug: ${restaurant.slug})`)

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Payment Methods
    // ──────────────────────────────────────────────────────────────────────────
    const paymentMethodDefs = [
        {
            type: PaymentMethodType.CASH,
            isActive: true,
            accountName: 'Kasir Utama',
        },
        {
            type: PaymentMethodType.QRIS,
            isActive: true,
            merchantId: 'ID102030405060',
            accountName: 'Warung Nusantara',
            // In production, qrCode would be an image URL
        },
        {
            type: PaymentMethodType.GOPAY,
            isActive: true,
            accountNumber: '08123456789',
            accountName: 'Warung Nusantara',
        },
        {
            type: PaymentMethodType.OVO,
            isActive: true,
            accountNumber: '08123456789',
            accountName: 'Warung Nusantara',
        },
        {
            type: PaymentMethodType.DANA,
            isActive: true,
            accountNumber: '08123456789',
            accountName: 'Warung Nusantara',
        },
        {
            type: PaymentMethodType.SHOPEEPAY,
            isActive: false, // Inactive by default but visible in settings
            accountNumber: '08123456789',
            accountName: 'Warung Nusantara',
        },
    ]

    const createdPaymentMethods: Record<string, string> = {} // type -> id
    for (const pm of paymentMethodDefs) {
        const existing = await prisma.paymentMethod.findFirst({
            where: { restaurantId: restaurant.id, type: pm.type },
        })
        if (!existing) {
            const created = await prisma.paymentMethod.create({
                data: { ...pm, restaurantId: restaurant.id },
            })
            createdPaymentMethods[pm.type] = created.id
        } else {
            await prisma.paymentMethod.update({
                where: { id: existing.id },
                data: { isActive: pm.isActive, accountName: pm.accountName },
            })
            createdPaymentMethods[pm.type] = existing.id
        }
    }
    console.log(`✅ Payment Methods: ${Object.keys(createdPaymentMethods).join(', ')}`)

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Menu Categories + Items
    // ──────────────────────────────────────────────────────────────────────────
    const categoriesData = [
        {
            name: 'Makanan Utama',
            description: 'Hidangan utama pilihan nusantara',
            displayOrder: 1,
            items: [
                { name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan ayam, udang, telur, dan sayuran segar', price: 35000, isBestSeller: true, isRecommended: true },
                { name: 'Mie Goreng Jawa', description: 'Mie goreng khas Jawa dengan bumbu rempah tradisional', price: 32000, isBestSeller: true },
                { name: 'Ayam Penyet Sambal Bawang', description: 'Ayam goreng empuk dipenyet dengan sambal bawang pedas', price: 38000, isRecommended: true },
                { name: 'Rendang Daging Sapi', description: 'Daging sapi empuk dimasak rendang khas Padang', price: 52000, isBestSeller: true },
                { name: 'Ikan Bakar Bumbu Bali', description: 'Ikan segar dibakar dengan bumbu Bali yang kaya rempah', price: 48000 },
                { name: 'Soto Ayam Lamongan', description: 'Soto ayam kuah kuning dengan koya, tauge, dan perkedel', price: 28000, isRecommended: true },
                { name: 'Gado-Gado Jakarta', description: 'Sayuran rebus, tahu, tempe dengan siraman saus kacang istimewa', price: 25000 },
                { name: 'Nasi Uduk Komplit', description: 'Nasi uduk dengan ayam goreng, tempe orek, emping, dan sambal', price: 32000 },
            ],
        },
        {
            name: 'Makanan Ringan & Snack',
            description: 'Camilan dan gorengan lezat',
            displayOrder: 2,
            items: [
                { name: 'Pisang Goreng Crispy', description: 'Pisang kepok goreng crispy dengan taburan keju', price: 18000, isBestSeller: true },
                { name: 'Bakwan Jagung', description: 'Bakwan jagung manis goreng garing, 5 pcs', price: 15000 },
                { name: 'Tahu Crispy Sambal Matah', description: 'Tahu goreng crispy dengan sambal matah segar', price: 20000, isRecommended: true },
                { name: 'Tempe Mendoan', description: 'Tempe tipis digoreng setengah matang, khas Purwokerto, 5 pcs', price: 14000 },
                { name: 'Kerupuk Emping Melinjo', description: 'Emping melinjo renyah, cocok sebagai pelengkap', price: 10000 },
            ],
        },
        {
            name: 'Minuman Segar',
            description: 'Aneka minuman dingin dan hangat',
            displayOrder: 3,
            items: [
                { name: 'Es Teh Manis Jumbo', description: 'Teh hitam manis dengan es batu, ukuran jumbo', price: 8000, isBestSeller: true },
                { name: 'Es Jeruk Peras', description: 'Jeruk peras segar dengan es batu, tanpa pengawet', price: 12000, isRecommended: true },
                { name: 'Jus Alpukat Kental', description: 'Jus alpukat segar dengan susu, kental dan creamy', price: 18000 },
                { name: 'Es Cendol Dawet', description: 'Minuman tradisional dengan santan, gula merah, dan cendol', price: 15000, isBestSeller: true },
                { name: 'Kopi Tubruk', description: 'Kopi hitam tubruk khas Jawa, diseduh dengan cara tradisional', price: 10000 },
                { name: 'Air Mineral Botol', description: 'Air mineral kemasan 600ml', price: 5000 },
                { name: 'Es Susu Coklat', description: 'Susu UHT coklat dengan es batu dan sedikit milo', price: 14000 },
            ],
        },
        {
            name: 'Paket Hemat',
            description: 'Paket makanan langkap harga terjangkau',
            displayOrder: 4,
            items: [
                { name: 'Paket Nasi + Ayam + Es Teh', description: 'Nasi putih + ayam goreng + es teh manis jumbo', price: 35000, isBestSeller: true, isRecommended: true },
                { name: 'Paket Berdua Hemat', description: '2 nasi goreng + 2 es teh manis + 2 pisang goreng', price: 75000, isRecommended: true },
                { name: 'Paket Keluarga (4 Orang)', description: '4 nasi putih + 2 lauk pilihan + 4 es teh + bakwan', price: 145000, isBestSeller: true },
            ],
        },
        {
            name: 'Dessert & Penutup',
            description: 'Hidangan penutup tradisional dan modern',
            displayOrder: 5,
            items: [
                { name: 'Klepon Isi Gula Merah', description: 'Klepon tradisional dari tepung ketan isi gula merah, 8 pcs', price: 16000, isRecommended: true },
                { name: 'Es Campur Spesial', description: 'Es serut dengan berbagai topping: cincau, kolang-kaling, tape', price: 18000, isBestSeller: true },
                { name: 'Puding Coklat Saus Vla', description: 'Puding coklat lembut dengan saus vla vanilla', price: 15000 },
            ],
        },
    ]

    const createdMenuItems: { id: string; price: number }[] = []

    for (const catDef of categoriesData) {
        let category = await prisma.category.findFirst({
            where: { restaurantId: restaurant.id, name: catDef.name },
        })
        if (!category) {
            category = await prisma.category.create({
                data: {
                    name: catDef.name,
                    description: catDef.description,
                    displayOrder: catDef.displayOrder,
                    restaurantId: restaurant.id,
                },
            })
        }

        for (let i = 0; i < catDef.items.length; i++) {
            const itemDef = catDef.items[i]
            const existing = await prisma.menuItem.findFirst({
                where: { restaurantId: restaurant.id, name: itemDef.name },
            })
            if (!existing) {
                const menuItem = await prisma.menuItem.create({
                    data: {
                        name: itemDef.name,
                        description: itemDef.description,
                        price: itemDef.price,
                        isAvailable: true,
                        displayOrder: i,
                        isBestSeller: itemDef.isBestSeller ?? false,
                        isRecommended: itemDef.isRecommended ?? false,
                        restaurantId: restaurant.id,
                        categoryId: category.id,
                    },
                })
                createdMenuItems.push({ id: menuItem.id, price: menuItem.price })
            } else {
                createdMenuItems.push({ id: existing.id, price: existing.price })
            }
        }
        console.log(`  📂 Category "${catDef.name}": ${catDef.items.length} items`)
    }
    console.log(`✅ Menu Items: ${createdMenuItems.length} total`)

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Sample Orders (past 30 days, realistic distribution)
    // ──────────────────────────────────────────────────────────────────────────
    // Create a demo guest customer
    const demoCustomer = await prisma.user.upsert({
        where: { email: 'customer@demo.id' },
        update: {},
        create: {
            name: 'Pelanggan Demo',
            email: 'customer@demo.id',
            phone: '08987654321',
            role: 'CUSTOMER',
        },
    })

    const paymentTypes = [
        PaymentMethodType.CASH,
        PaymentMethodType.QRIS,
        PaymentMethodType.GOPAY,
        PaymentMethodType.OVO,
        PaymentMethodType.DANA,
    ]

    const orderStatusDistribution: OrderStatus[] = [
        'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
        'COMPLETED', 'COMPLETED', 'COMPLETED',
        'CANCELLED',
        'PENDING',
    ]

    const tableNumbers = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', null]

    // Check existing demo order count to avoid duplicates on re-seed
    const existingOrders = await prisma.order.count({
        where: { restaurantId: restaurant.id },
    })

    let ordersCreated = 0
    if (existingOrders < 50) {
        // Generate ~60 orders spread over last 30 days
        for (let day = 30; day >= 0; day--) {
            const ordersPerDay = randInt(0, 5)
            for (let o = 0; o < ordersPerDay; o++) {
                const status = randItem(orderStatusDistribution)
                const payType = randItem(paymentTypes)
                const methodId = createdPaymentMethods[payType]
                if (!methodId) continue

                // Pick 1-4 random menu items
                const numItems = randInt(1, 4)
                const pickedItems: { id: string; price: number }[] = []
                for (let k = 0; k < numItems; k++) {
                    pickedItems.push(randItem(createdMenuItems))
                }

                const totalAmount = pickedItems.reduce(
                    (sum, item) => sum + item.price * randInt(1, 2),
                    0
                )

                const createdAt = daysAgo(day)
                createdAt.setHours(randInt(9, 21), randInt(0, 59))

                const orderNumber = `ORD-${createdAt.getTime().toString().slice(-8)}-${o}`

                // Skip if order number already exists
                const existingOrder = await prisma.order.findFirst({ where: { orderNumber } })
                if (existingOrder) continue

                await prisma.order.create({
                    data: {
                        orderNumber,
                        totalAmount,
                        tableNumber: randItem(tableNumbers),
                        status,
                        paymentStatus: status === 'COMPLETED' ? 'PAID' : status === 'CANCELLED' ? 'FAILED' : 'PENDING',
                        restaurantId: restaurant.id,
                        customerId: demoCustomer.id,
                        createdAt,
                        updatedAt: createdAt,
                        orderItems: {
                            create: pickedItems.map(item => ({
                                menuItemId: item.id,
                                quantity: randInt(1, 2),
                                price: item.price,
                            })),
                        },
                        payment: status !== 'PENDING'
                            ? {
                                create: {
                                    amount: totalAmount,
                                    type: payType,
                                    status: status === 'COMPLETED' ? PaymentStatus.PAID : PaymentStatus.FAILED,
                                    methodId,
                                    paymentDate: status === 'COMPLETED' ? createdAt : null,
                                },
                            }
                            : undefined,
                    },
                })
                ordersCreated++
            }
        }
        console.log(`✅ Demo Orders created: ${ordersCreated}`)
    } else {
        console.log(`⏭️  Skipping orders — ${existingOrders} already exist`)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Summary
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(50))
    console.log('🎉 DEMO SEED COMPLETE!')
    console.log('═'.repeat(50))
    console.log(`\n📋 Login credentials:`)
    console.log(`   Email   : demo@restohub.id`)
    console.log(`   Password: demo1234`)
    console.log(`\n🌐 Digital Menu URL:`)
    console.log(`   /menu/warung-nusantara-demo`)
    console.log('\n' + '═'.repeat(50) + '\n')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
