import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug

    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: {
                OR: [
                    { id: slug },
                    { slug: slug }
                ]
            },
            include: {
                menuItems: {
                    where: { isAvailable: true }
                },
                categories: true,
                paymentMethods: {
                    where: { isActive: true }
                }
            }
        })

        if (!restaurant) {
            return NextResponse.json(
                { success: false, error: 'Restaurant not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: restaurant
        })
    } catch (error) {
        console.error('Error fetching restaurant:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
