import nodemailer from 'nodemailer'

// Create transporter from environment variables
const createTransporter = () => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_PORT || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
    throw new Error('Missing email configuration in environment variables')
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: process.env.MAIL_PORT === '465', // true for 465, false for 587
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  })
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const transporter = createTransporter()

    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'VEXIM GLOBAL'}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version
    })

    console.log('[v0] Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[v0] Error sending email:', error)
    throw error
  }
}

// Template functions
export const emailTemplates = {
  testEmail: (recipientName: string) => ({
    subject: 'Test Email - VEXIM GLOBAL',
    html: `
      <h2>Hello ${recipientName},</h2>
      <p>This is a test email from VEXIM GLOBAL to verify email configuration.</p>
      <p>If you received this email, your email service is working correctly!</p>
      <br/>
      <p>Best regards,<br/>VEXIM GLOBAL Team</p>
    `,
  }),

  serviceCreated: (serviceName: string, productName: string, clientEmail: string) => ({
    subject: `New Service Created: ${productName}`,
    html: `
      <h2>New Service Created</h2>
      <p>A new service has been created:</p>
      <ul>
        <li><strong>Service Type:</strong> ${serviceName}</li>
        <li><strong>Product Name:</strong> ${productName}</li>
        <li><strong>Client Email:</strong> ${clientEmail}</li>
      </ul>
      <p>Please log in to your dashboard to view more details.</p>
    `,
  }),

  documentUploaded: (documentName: string, serviceName: string) => ({
    subject: `Document Uploaded: ${documentName}`,
    html: `
      <h2>Document Upload Notification</h2>
      <p>A new document has been uploaded:</p>
      <ul>
        <li><strong>Document:</strong> ${documentName}</li>
        <li><strong>Service:</strong> ${serviceName}</li>
      </ul>
      <p>Please review it in your dashboard.</p>
    `,
  }),

  serviceStageChanged: (productName: string, fromStage: string, toStage: string) => ({
    subject: `Service Update: ${productName} moved to ${toStage}`,
    html: `
      <h2>Service Status Update</h2>
      <p>Your service <strong>${productName}</strong> has been updated:</p>
      <ul>
        <li><strong>Previous Stage:</strong> ${fromStage}</li>
        <li><strong>Current Stage:</strong> ${toStage}</li>
      </ul>
      <p>Please log in to your dashboard for more details.</p>
      <br/>
      <p>Best regards,<br/>VEXIM GLOBAL Team</p>
    `,
  }),
}
