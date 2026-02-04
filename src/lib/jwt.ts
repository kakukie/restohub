import { SignJWT, jwtVerify } from 'jose'

const SECRET_KEY = process.env.NEXTAUTH_SECRET
if (!SECRET_KEY) {
    throw new Error('Missing NEXTAUTH_SECRET environment variable')
}
const KEY = new TextEncoder().encode(SECRET_KEY)

export async function signAccessToken(payload: any) {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 15 * 60 // 15 minutes

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(exp)
        .setIssuedAt(iat)
        .setNotBefore(iat)
        .sign(KEY)
}

export async function signRefreshToken(payload: any) {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 7 * 24 * 60 * 60 // 7 days

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(exp)
        .setIssuedAt(iat)
        .setNotBefore(iat)
        .sign(KEY)
}

export async function verifyJwt(token: string) {
    try {
        const { payload } = await jwtVerify(token, KEY, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        return null
    }
}
