import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// GET /api/restaurants - Get all restaurants
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const adminId = searchParams.get('adminId')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    if (adminId) {
      where.adminId = adminId
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { email: true }
        },
        _count: {
          select: { menuItems: true, orders: true }
        }
      }
    })

    // Transform data to match expected frontend format
    const formattedRestaurants = restaurants.map(r => ({
      ...r,
      adminEmail: r.admin?.email || '', // Map relation to flat property
      totalMenuItems: r._count.menuItems,
      totalOrders: r._count.orders,
      totalRevenue: 0
    }))

    return NextResponse.json({
      success: true,
      data: formattedRestaurants
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch restaurants'
    }, { status: 500 })
  }
}

// POST /api/restaurants - Create a new restaurant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, address, phone, email, parentId, adminId } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    // Generate cleaner slug (name-randomString)
    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${randomSuffix}`

    let resolvedAdminId = adminId

    // If creating a branch
    if (parentId) {
      // Validate parent
      // Validate parent
      const parent = await prisma.restaurant.findUnique({
        where: { id: parentId },
        select: { id: true, adminId: true, maxAdmins: true } // Fetch required fields
      })

      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent restaurant not found' }, { status: 404 })
      }

      // 0. Check Max Admins Limit if creating new admin
      if (body.newAdminEmail) {
        if (parent.maxAdmins !== null && parent.maxAdmins !== undefined) {
          // Count branches that have distinct admins (proxied by checking if adminId != parent.adminId)
          // Actually, simpler: Count total branches? No, limit is on *Admins*.
          // But since 1 branch = 1 admin (potentially), and we interpret maxAdmins as "Max Sub-Admins",
          // We count branches where adminId IS NOT parent.adminId.
          const currentAdminsCount = await prisma.restaurant.count({
            where: {
              parentId: parent.id,
              adminId: { not: parent.adminId }
            }
          })

          if (currentAdminsCount >= parent.maxAdmins) {
            return NextResponse.json({ success: false, error: `Admin limit reached (${parent.maxAdmins} max). Upgrade plan.` }, { status: 403 })
          }
        }
      }

      // Handle New Admin Logic
      if (body.newAdminEmail && body.newAdminPassword) {
        // Create new User for this branch
        const existingUser = await prisma.user.findUnique({ where: { email: body.newAdminEmail } })
        if (existingUser) {
          return NextResponse.json({ success: false, error: 'Email for new admin already exists' }, { status: 400 })
        }

        const hashedPassword = await hashPassword(body.newAdminPassword)
        const newUser = await prisma.user.create({
          data: {
            name: body.newAdminName || 'Branch Manager',
            email: body.newAdminEmail,
            password: hashedPassword,
            role: 'RESTAURANT_ADMIN',
            phone: body.phone || ''
          }
        })
        resolvedAdminId = newUser.id
      } else {
        // Inherit Parent Admin
        resolvedAdminId = parent.adminId
      }
    }

    // Create restaurant
    // Use transaction to ensure data sync if requested
    const newRestaurant = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurant.create({
        data: {
          name,
          slug,
          description: description || '',
          address: address || '',
          phone: phone || '',
          email: email || '',
          isActive: true,
          status: 'ACTIVE',
          package: 'BASIC',
          adminId: resolvedAdminId || '', // Fallback or assume provided
          parentId: parentId || null
        }
      })

      // Sync Data from Parent if it's a branch AND requested
      if (parentId && body.enableSync) {
        // 1. Copy Payment Methods
        const parentPayments = await tx.paymentMethod.findMany({ where: { restaurantId: parentId } })
        if (parentPayments.length > 0) {
          await tx.paymentMethod.createMany({
            data: parentPayments.map(p => ({
              restaurantId: created.id,
              type: p.type,
              merchantId: p.merchantId,
              qrCode: p.qrCode,
              isActive: p.isActive
            }))
          })
        }

        // 2. Copy Categories & Menu Items
        // We need to fetch categories WITH menu items to preserve relationships
        const parentCategories = await tx.category.findMany({
          where: { restaurantId: parentId },
          include: { menuItems: true }
        })

        for (const cat of parentCategories) {
          // Create new Category
          const newCat = await tx.category.create({
            data: {
              name: cat.name,
              description: cat.description,
              displayOrder: cat.displayOrder,
              isActive: cat.isActive,
              restaurantId: created.id
            }
          })

          // Copy Menu Items for this category
          if (cat.menuItems.length > 0) {
            await tx.menuItem.createMany({
              data: cat.menuItems.map(item => ({
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                isAvailable: item.isAvailable,
                displayOrder: item.displayOrder,
                displayName: item.displayName,
                isBestSeller: item.isBestSeller,
                isRecommended: item.isRecommended,
                restaurantId: created.id,
                categoryId: newCat.id // Link to new Category
              }))
            })
          }
        }
      }

      return created
    })

    return NextResponse.json({
      success: true,
      data: {
        ...newRestaurant,
        totalMenuItems: 0,
        totalOrders: 0,
        totalRevenue: 0
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create Restaurant Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create restaurant'
    }, { status: 500 })
  }
}
// PUT /api/restaurants - Update a restaurant (Status, Package, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Restaurant ID is required'
      }, { status: 400 })
    }

    // Clean up updates to only include valid fields if necessary, 
    // but for now we trust `updates` contains valid columns like status, package, isActive.

    // Explicitly handle isActive sync if status changes
    if (updates.status) {
      if (updates.status === 'ACTIVE') {
        updates.isActive = true
      } else {
        updates.isActive = false
      }
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: updates
    })

    return NextResponse.json({
      success: true,
      data: updatedRestaurant,
      message: 'Restaurant updated successfully'
    })
  } catch (error) {
    console.error('Update Restaurant Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update restaurant'
    }, { status: 500 })
  }
}
