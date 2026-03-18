import midtransClient from 'midtrans-client'
import crypto from 'crypto'

const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
const clientKey = process.env.MIDTRANS_CLIENT_KEY || ''
const isProduction = (process.env.MIDTRANS_IS_PRODUCTION || '').toString() === 'true'

let snapInstance: any

export const isMidtransConfigured = () => Boolean(serverKey && clientKey)

export function getSnapClient() {
    if (!snapInstance) {
        if (!isMidtransConfigured()) {
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
    const toHash = orderId + statusCode + grossAmount + serverKey
    const expected = crypto.createHash('sha512').update(toHash).digest('hex')
    return expected === signatureKey
}
