export async function sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    const apiKey = process.env.BREVO_API_KEY

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #10B981;">Meenuin Password Reset</h2>
            <p>Hello,</p>
            <p>You recently requested to reset your password for your Meenuin account. Click the button below to reset it.</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px; color: #fff; background-color: #10B981; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
            <p>Thanks,<br>The Meenuin Team</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">If you're having trouble clicking the password reset button, copy and paste the URL below into your web browser:</p>
            <p style="font-size: 12px; color: #10B981;">${resetLink}</p>
        </div>
    `

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey as string,
                'content-type': 'application/json'
            } as any,
            body: JSON.stringify({
                sender: {
                    name: "Meenuin Admin",
                    email: process.env.SMTP_FROM || 'noreply@meenuin.biz.id'
                },
                to: [{ email: to }],
                subject: 'Reset Password',
                htmlContent: htmlContent
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Brevo API Error:', data)
            return { success: false, error: data.message || 'Failed to send email via Brevo' }
        }

        console.log('Password reset email sent via Brevo:', data.messageId)
        return { success: true, messageId: data.messageId }
    } catch (error: any) {
        console.error('Error sending password reset email via Brevo:', error.message || error)
        return { success: false, error: 'Failed to send email' }
    }
}

export async function sendActivationEmail(to: string, ownerName: string, restoName: string) {
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
    const apiKey = process.env.BREVO_API_KEY

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #10B981;">Welcome to Meenuin!</h2>
            <p>Hello ${ownerName},</p>
            <p>Great news! Your workspace for <strong>${restoName}</strong> has been successfully activated.</p>
            <p>You can now log in to your dashboard to set up your digital menu, manage branches, and view analytics.</p>
            <a href="${loginLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px; color: #fff; background-color: #10B981; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
            <p>If you need any help getting started, check out our helpdesk or contact support.</p>
            <p>To your success,<br>The Meenuin Team</p>
        </div>
    `

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey as string,
                'content-type': 'application/json'
            } as any,
            body: JSON.stringify({
                sender: {
                    name: "Meenuin Admin",
                    email: process.env.SMTP_FROM || 'noreply@meenuin.biz.id'
                },
                to: [{ email: to }],
                subject: 'Your Meenuin Account is Active!',
                htmlContent: htmlContent
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Brevo API Error:', data)
            return { success: false, error: data.message || 'Failed to send email via Brevo' }
        }

        console.log('Activation email sent via Brevo:', data.messageId)
        return { success: true, messageId: data.messageId }
    } catch (error: any) {
        console.error('Error sending activation email via Brevo:', error.message || error)
        return { success: false, error: 'Failed to send email' }
    }
}

export async function sendApproveRestaurantEmail(to: string, restoName: string) {
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
    const apiKey = process.env.BREVO_API_KEY

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Selamat! Restoran Anda Disetujui</h2>
            <p>Halo,</p>
            <p>Berita luar biasa! Pengajuan untuk restoran <strong>${restoName}</strong> telah disetujui oleh tim Meenuin.</p>
            <p>Sekarang Anda dapat masuk ke dashboard untuk mulai mengatur menu digital dan mengelola restoran Anda.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #10B981; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">Login Sekarang</a>
            </div>

            <p>Gunakan email terdaftar Anda dan password yang telah Anda buat saat pendaftaran.</p>
            <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi dukungan kami.</p>
            <p>Selamat bergabung,<br>Tim Meenuin</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:</p>
            <p style="font-size: 12px; color: #10B981;">${loginLink}</p>
        </div>
    `

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey as string,
                'content-type': 'application/json'
            } as any,
            body: JSON.stringify({
                sender: {
                    name: "Meenuin Admin",
                    email: process.env.SMTP_FROM || 'noreply@meenuin.biz.id'
                },
                to: [{ email: to }],
                subject: `Restoran ${restoName} Telah Disetujui!`,
                htmlContent: htmlContent
            })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to send email')
        return { success: true, messageId: data.messageId }
    } catch (error: any) {
        console.error('Error sending approve email:', error.message)
        return { success: false, error: 'Failed to send approval email' }
    }
}

export async function sendRejectRestaurantEmail(to: string, restoName: string) {
    const supportLink = "https://wa.me/6288294945050" // WhatsApp Support from Landing Page
    const apiKey = process.env.BREVO_API_KEY

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Update Pengajuan Restoran</h2>
            <p>Halo,</p>
            <p>Mohon maaf, saat ini pengajuan untuk restoran <strong>${restoName}</strong> belum dapat kami setujui.</p>
            <p>Mungkin ada beberapa informasi yang perlu dilengkapi atau belum sesuai dengan kriteria kami.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${supportLink}" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #ef4444; text-decoration: none; border-radius: 8px;">Hubungi Tim Support</a>
            </div>

            <p>Anda dapat membalas email ini atau klik tombol di atas untuk menghubungi tim support kami terkait informasi lebih lanjut.</p>
            <p>Terima kasih,<br>Tim Meenuin</p>
        </div>
    `

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': (apiKey || '') as string,
                'content-type': 'application/json'
            } as Record<string, string>,
            body: JSON.stringify({
                sender: {
                    name: "Meenuin Admin",
                    email: process.env.SMTP_FROM || 'noreply@meenuin.biz.id'
                },
                to: [{ email: to }],
                subject: `Update Pengajuan Restoran ${restoName}`,
                htmlContent: htmlContent
            })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to send email')
        return { success: true, messageId: data.messageId }
    } catch (error: any) {
        console.error('Error sending reject email:', error.message)
        return { success: false, error: 'Failed to send rejection email' }
    }
}

export async function sendPaymentSuccessEmail(
    to: string,
    ownerName: string,
    restoName: string,
    planName: string,
    amount: number
) {
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
    const apiKey = process.env.BREVO_API_KEY
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00a669 0%, #059669 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Pembayaran Berhasil!</h1>
                <p style="color: #d1fae5; margin: 8px 0 0 0;">Akun restoran Anda sudah aktif</p>
            </div>
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p>Halo <strong>${ownerName}</strong>,</p>
                <p>Pembayaran subscription untuk restoran <strong>${restoName}</strong> telah berhasil divalidasi oleh tim kami. Akun Anda sekarang sudah <strong style="color: #00a669;">AKTIF</strong>!</p>

                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h3 style="color: #065f46; margin: 0 0 12px 0;">Ringkasan Pembayaran</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 6px 0; color: #6b7280;">Paket</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${planName}</td></tr>
                        <tr><td style="padding: 6px 0; color: #6b7280;">Total Dibayar</td><td style="padding: 6px 0; font-weight: bold; color: #00a669; text-align: right;">${formattedAmount}</td></tr>
                        <tr><td style="padding: 6px 0; color: #6b7280;">Status</td><td style="padding: 6px 0; font-weight: bold; color: #00a669; text-align: right;">✅ LUNAS</td></tr>
                    </table>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                    <a href="${loginLink}" style="display: inline-block; padding: 14px 36px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #00a669; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,166,105,0.3);">Login ke Dashboard Sekarang</a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">Jika Anda memiliki pertanyaan, hubungi support kami atau balas email ini.</p>
                <p>Salam sukses,<br><strong>Tim Meenuin</strong></p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">© ${new Date().getFullYear()} Meenuin Technology. All rights reserved.</p>
        </div>
    `

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': (apiKey || '') as string,
                'content-type': 'application/json'
            } as Record<string, string>,
            body: JSON.stringify({
                sender: {
                    name: "Meenuin Admin",
                    email: process.env.SMTP_FROM || 'noreply@meenuin.biz.id'
                },
                to: [{ email: to }],
                subject: `✅ Pembayaran Berhasil – Akun ${restoName} Kini Aktif!`,
                htmlContent: htmlContent
            })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to send email')
        console.log('Payment success email sent:', data.messageId)
        return { success: true, messageId: data.messageId }
    } catch (error: any) {
        console.error('Error sending payment success email:', error.message)
        return { success: false, error: 'Failed to send email' }
    }
}
