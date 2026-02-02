import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER) {
        console.log('[MOCK EMAIL] To:', to, 'Subject:', subject)
        return { success: true, mocked: true }
    }

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        })
        console.log('Email sent: %s', info.messageId)
        return { success: true, id: info.messageId }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}
