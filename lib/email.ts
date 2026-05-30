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
  setPassword: (opts: { fullName?: string; email: string; actionLink: string; roleLabel?: string }) => ({
    subject: 'Chào mừng bạn đến với VEXIM GLOBAL - Thiết lập mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color:#0f766e;">Chào mừng${opts.fullName ? ' ' + opts.fullName : ''} đến với VEXIM GLOBAL!</h2>
        <p>Tài khoản của bạn đã được tạo với email: <strong>${opts.email}</strong></p>
        ${opts.roleLabel ? `<p>Vai trò: <strong>${opts.roleLabel}</strong></p>` : ''}
        <p>Vui lòng nhấn vào nút dưới đây để thiết lập mật khẩu và truy cập hệ thống:</p>
        <p style="margin: 24px 0;">
          <a href="${opts.actionLink}"
             style="background:#0f766e;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
            Thiết lập mật khẩu
          </a>
        </p>
        <p style="font-size:13px;color:#666;">Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:</p>
        <p style="font-size:13px;word-break:break-all;color:#0f766e;">${opts.actionLink}</p>
        <p style="font-size:13px;color:#666;">Liên kết này chỉ có hiệu lực trong một khoảng thời gian giới hạn.</p>
        <br/>
        <p>Trân trọng,<br/>VEXIM GLOBAL Team</p>
      </div>
    `,
  }),

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
