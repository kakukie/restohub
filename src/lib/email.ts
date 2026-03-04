export async function sendEmail(to: string, subject: string, html: string) {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
        console.warn('BREVO_API_KEY is not set. Cannot send email.')
        return { success: false, error: 'Missing API Key' }
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey as string,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.NEXT_PUBLIC_APP_NAME || "Meenuin",
                    email: process.env.SMTP_FROM || 'noreply@meenuin.biz.id'
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Brevo API Error:', data)
            return { success: false, error: data.message || 'Failed to send email via Brevo' }
        }

        console.log('Email sent via Brevo: %s', data.messageId)
        return { success: true, id: data.messageId }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}
