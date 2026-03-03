import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        // Do not fail on invalid certs for local development if needed
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
})

// Optional verification check on startup (commented out to prevent crash on boot if offline)
// transporter.verify(function (error, success) {
//     if (error) {
//         console.warn("SMTP Connection Warning:", error.message);
//     } else {
//         console.log("SMTP Server is ready to take our messages");
//     }
// });

export async function sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Meenuin Admin" <noreply@Meenuin.com>',
        to,
        subject: 'Reset Password',
        html: `
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
        `,
    }

    try {
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'mail.meenuin.biz.id') {
            console.log('--- MOCK EMAIL INTERCEPTED ---')
            console.log(`To: ${to}`)
            console.log(`Subject: Password Reset`)
            console.log(`Reset Link: ${resetLink}`)
            console.log('------------------------------')
            return { success: true, messageId: 'mock-id' }
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('Password reset email sent: %s', info.messageId)

        // Only valid if using ethereal
        if (nodemailer.getTestMessageUrl(info)) {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
        }

        return { success: true, messageId: info.messageId }
    } catch (error: any) {
        console.error('Error sending password reset email:', error.message || error)
        return { success: false, error: 'Failed to send email' }
    }
}

export async function sendActivationEmail(to: string, ownerName: string, restoName: string) {
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Meenuin Admin" <noreply@Meenuin.com>',
        to,
        subject: 'Your Meenuin Account is Active!',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #10B981;">Welcome to Meenuin!</h2>
                <p>Hello ${ownerName},</p>
                <p>Great news! Your workspace for <strong>${restoName}</strong> has been successfully activated.</p>
                <p>You can now log in to your dashboard to set up your digital menu, manage branches, and view analytics.</p>
                <a href="${loginLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px; color: #fff; background-color: #10B981; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                <p>If you need any help getting started, check out our helpdesk or contact support.</p>
                <p>To your success,<br>The Meenuin Team</p>
            </div>
        `,
    }

    try {
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'mail.meenuin.biz.id') {
            console.log('--- MOCK EMAIL INTERCEPTED ---')
            console.log(`To: ${to}`)
            console.log(`Subject: Account Activation`)
            console.log(`Login Link: ${loginLink}`)
            console.log('------------------------------')
            return { success: true, messageId: 'mock-id' }
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('Activation email sent: %s', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error: any) {
        console.error('Error sending activation email:', error.message || error)
        return { success: false, error: 'Failed to send email' }
    }
}
