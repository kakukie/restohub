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

    if (!apiKey) {
        console.log('--- MOCK EMAIL INTERCEPTED (NO BREVO_API_KEY) ---')
        console.log(`To: ${to}`)
        console.log(`Subject: Reset Password`)
        console.log(`Reset Link: ${resetLink}`)
        console.log('-------------------------------------------------')
        return { success: true, messageId: 'mock-id' }
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
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

    if (!apiKey) {
        console.log('--- MOCK EMAIL INTERCEPTED (NO BREVO_API_KEY) ---')
        console.log(`To: ${to}`)
        console.log(`Subject: Your Meenuin Account is Active!`)
        console.log(`Login Link: ${loginLink}`)
        console.log('-------------------------------------------------')
        return { success: true, messageId: 'mock-id' }
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
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
