import midtransClient from 'midtrans-client'
import crypto from 'crypto'

function normalizeBoolean(value?: string | null) {
    if (value == null) return undefined
    const normalized = value.toString().trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
    return undefined
}

function inferProductionMode(serverKey: string) {
    const key = serverKey.trim()
    if (!key) return undefined
    if (key.startsWith('SB-')) return false
    return true
}

export function getMidtransConfig() {
    const serverKey = (process.env.MIDTRANS_SERVER_KEY || process.env.NEXT_PUBLIC_MIDTRANS_SERVER_KEY || '').trim()
    const clientKey = (process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '').trim()
    const explicitMode = normalizeBoolean(process.env.MIDTRANS_IS_PRODUCTION ?? process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION)
    const inferredMode = inferProductionMode(serverKey)
    const isProduction = explicitMode ?? inferredMode ?? false

    return { serverKey, clientKey, isProduction }
}

let snapInstance: any

export const isMidtransConfigured = () => {
    const { serverKey, clientKey } = getMidtransConfig()
    return Boolean(serverKey && clientKey)
}

export function getSnapClient() {
    const { serverKey, clientKey, isProduction } = getMidtransConfig()

    if (!snapInstance) {
        if (!serverKey || !clientKey) {
            throw new Error('Midtrans keys are not configured')
        }
        snapInstance = new midtransClient.Snap({
            isProduction,
            serverKey,
            clientKey
        })
    }
    return snapInstance
}

export function verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string) {
    const { serverKey } = getMidtransConfig()
    const toHash = orderId + statusCode + grossAmount + serverKey
    const expected = crypto.createHash('sha512').update(toHash).digest('hex')
    return expected === signatureKey
}
