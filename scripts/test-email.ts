import nodemailer from 'nodemailer'

async function testEmail() {
  console.log('[v0] Starting email test...')
  console.log('[v0] Email config:', {
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USERNAME: process.env.MAIL_USERNAME,
    MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
  })

  if (!process.env.MAIL_HOST || !process.env.MAIL_PORT || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
    console.error('[v0] Missing email configuration!')
    process.exit(1)
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: process.env.MAIL_PORT === '465',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    })

    console.log('[v0] Testing SMTP connection...')
    await transporter.verify()
    console.log('[v0] ✅ SMTP connection verified!')

    console.log('[v0] Sending test email...')
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'VEXIM GLOBAL'}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: 'contact@veximglobal.com',
      subject: 'Test Email - VEXIM GLOBAL',
      html: `
        <h2>Hello,</h2>
        <p>This is a test email from VEXIM GLOBAL to verify email configuration.</p>
        <p>If you received this email, your email service is working correctly!</p>
        <br/>
        <p>Best regards,<br/>VEXIM GLOBAL Team</p>
      `,
      text: 'This is a test email from VEXIM GLOBAL.',
    })

    console.log('[v0] ✅ Email sent successfully!')
    console.log('[v0] Message ID:', info.messageId)
    console.log('[v0] Response:', info.response)
    console.log('[v0] Email test completed successfully!')
  } catch (error) {
    console.error('[v0] ❌ Error:', error)
    process.exit(1)
  }
}

testEmail()
