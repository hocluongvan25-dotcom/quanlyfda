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

// Base URL of the app, used for action buttons in emails.
const getAppUrl = () =>
  (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://quanlyfda.vercel.app'
  ).replace(/\/$/, '')

// Shared branded layout wrapper. All emails are sent in Vietnamese with a
// consistent VEXIM GLOBAL header/footer and teal brand color (#0f766e).
function layout(opts: { title: string; body: string }) {
  return `
  <div lang="vi" style="margin:0;padding:0;background-color:#f1f5f9;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="background:#0f766e;border-radius:12px 12px 0 0;padding:20px 24px;text-align:center;">
        <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px;">VEXIM GLOBAL</span>
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#0f766e;">${opts.title}</h2>
        ${opts.body}
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#94a3b8;">
        © ${new Date().getFullYear()} VEXIM GLOBAL. Email tự động, vui lòng không trả lời.
      </p>
    </div>
  </div>`
}

function button(href: string, label: string) {
  return `
    <p style="margin:24px 0;">
      <a href="${href}" style="background:#0f766e;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">
        ${label}
      </a>
    </p>`
}

function infoRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#64748b;width:40%;">${label}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:bold;">${value}</td>
    </tr>`
}

function infoTable(rows: string) {
  return `<table style="width:100%;border-collapse:collapse;margin:8px 0;">${rows}</table>`
}

// Template functions (toàn bộ nội dung bằng tiếng Việt)
export const emailTemplates = {
  setPassword: (opts: { fullName?: string; email: string; actionLink: string; roleLabel?: string }) => ({
    subject: 'Chào mừng bạn đến với VEXIM GLOBAL - Thiết lập mật khẩu',
    html: layout({
      title: `Chào mừng${opts.fullName ? ' ' + opts.fullName : ''} đến với VEXIM GLOBAL!`,
      body: `
        <p style="font-size:14px;line-height:1.6;">Tài khoản của bạn đã được tạo thành công.</p>
        ${infoTable(
          infoRow('Email', opts.email) +
          (opts.roleLabel ? infoRow('Vai trò', opts.roleLabel) : '')
        )}
        <p style="font-size:14px;line-height:1.6;">Vui lòng nhấn vào nút dưới đây để thiết lập mật khẩu và truy cập hệ thống:</p>
        ${button(opts.actionLink, 'Thiết lập mật khẩu')}
        <p style="font-size:13px;color:#64748b;">Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:</p>
        <p style="font-size:13px;word-break:break-all;color:#0f766e;">${opts.actionLink}</p>
        <p style="font-size:13px;color:#64748b;">Liên kết này chỉ có hiệu lực trong một khoảng thời gian giới hạn.</p>
      `,
    }),
  }),

  testEmail: (recipientName: string) => ({
    subject: 'Email kiểm tra - VEXIM GLOBAL',
    html: layout({
      title: `Xin chào ${recipientName},`,
      body: `
        <p style="font-size:14px;line-height:1.6;">Đây là email kiểm tra từ VEXIM GLOBAL để xác minh cấu hình gửi email.</p>
        <p style="font-size:14px;line-height:1.6;">Nếu bạn nhận được email này, dịch vụ gửi email của bạn đang hoạt động bình thường!</p>
      `,
    }),
  }),

  serviceCreated: (serviceTypeLabel: string, productName: string, clientEmail: string) => ({
    subject: `Dịch vụ mới đã được tạo: ${productName}`,
    html: layout({
      title: 'Dịch vụ mới đã được tạo',
      body: `
        <p style="font-size:14px;line-height:1.6;">Một dịch vụ mới vừa được khởi tạo trên hệ thống:</p>
        ${infoTable(
          infoRow('Loại dịch vụ', serviceTypeLabel) +
          infoRow('Tên sản phẩm', productName) +
          infoRow('Email khách hàng', clientEmail)
        )}
        <p style="font-size:14px;line-height:1.6;">Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
        ${button(`${getAppUrl()}/dashboard`, 'Xem chi tiết')}
      `,
    }),
  }),

  documentUploaded: (documentName: string, productName: string) => ({
    subject: `Tài liệu mới đã được tải lên: ${documentName}`,
    html: layout({
      title: 'Thông báo tải lên tài liệu',
      body: `
        <p style="font-size:14px;line-height:1.6;">Một tài liệu mới vừa được tải lên:</p>
        ${infoTable(
          infoRow('Tài liệu', documentName) +
          infoRow('Dịch vụ', productName)
        )}
        <p style="font-size:14px;line-height:1.6;">Vui lòng đăng nhập vào hệ thống để xem lại.</p>
        ${button(`${getAppUrl()}/dashboard`, 'Xem tài liệu')}
      `,
    }),
  }),

  usAgentRenewalReminder: (opts: {
    productName: string
    clientName: string | null
    usAgentName: string
    expiryDate: string        // ISO date string
    daysLeft: number          // 0 means today is expiry
  }) => {
    const expiryFormatted = new Date(opts.expiryDate).toLocaleDateString('vi-VN')
    const isToday = opts.daysLeft === 0
    const isUrgent = opts.daysLeft <= 7

    const urgencyColor = isToday ? '#dc2626' : isUrgent ? '#ca8a04' : '#0f766e'
    const urgencyBg   = isToday ? '#fef2f2' : isUrgent ? '#fefce8' : '#f0fdfa'
    const urgencyBorder = isToday ? '#dc2626' : isUrgent ? '#ca8a04' : '#0f766e'

    const daysLabel = isToday
      ? 'Hôm nay là ngày hết hạn dịch vụ US Agent'
      : `Dịch vụ US Agent sẽ hết hạn sau <strong>${opts.daysLeft} ngày</strong> nữa`

    return {
      subject: isToday
        ? `[KHẨN] US Agent cho "${opts.productName}" hết hạn hôm nay`
        : `Nhắc nhở gia hạn: US Agent cho "${opts.productName}" còn ${opts.daysLeft} ngày`,
      html: layout({
        title: 'Nhắc nhở gia hạn US Agent',
        body: `
          <p style="font-size:14px;line-height:1.6;">
            Kính gửi <strong>${opts.clientName || 'Quý khách'}</strong>,
          </p>
          <div style="background:${urgencyBg};border-left:4px solid ${urgencyBorder};padding:14px 16px;border-radius:4px;margin:12px 0;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:${urgencyColor};">
              ${daysLabel}
            </p>
          </div>
          ${infoTable(
            infoRow('Sản phẩm', opts.productName) +
            infoRow('Tên US Agent', opts.usAgentName) +
            infoRow('Ngày hết hạn', expiryFormatted)
          )}
          <p style="font-size:14px;line-height:1.6;">
            Để đảm bảo đăng ký FDA của bạn không bị gián đoạn, vui lòng liên hệ với chúng tôi để gia hạn dịch vụ US Agent kịp thời.
          </p>
          ${button(`${getAppUrl()}/dashboard`, 'Liên hệ gia hạn ngay')}
          <p style="font-size:13px;color:#64748b;line-height:1.6;">
            Nếu bạn đã liên hệ với nhân viên của chúng tôi, vui lòng bỏ qua email này.
          </p>
        `,
      }),
    }
  },

  serviceStageChanged: (
    productName: string, 
    fromStageLabel: string, 
    toStageLabel: string, 
    note?: string,
    fdaInfo?: { 
      fda_code: string
      fda_issue_date: string
      fda_expiry_date: string
      fda_duns_code: string
      fda_fei_code: string
    },
    usAgentInfo?: {
      us_agent_name: string
      us_agent_start_date: string
      us_agent_expiry_date: string
    }
  ) => ({
    subject: `Cập nhật dịch vụ: "${productName}" chuyển sang "${toStageLabel}"`,
    html: layout({
      title: 'Cập nhật trạng thái dịch vụ',
      body: `
        <p style="font-size:14px;line-height:1.6;">Dịch vụ <strong>${productName}</strong> của bạn vừa được cập nhật trạng thái:</p>
        ${infoTable(
          infoRow('Giai đoạn trước', fromStageLabel) +
          infoRow('Giai đoạn hiện tại', toStageLabel)
        )}
        ${fdaInfo ? `
        <h3 style="margin:16px 0 8px;font-size:14px;color:#0f766e;">Thông tin FDA đã được cấp:</h3>
        ${infoTable(
          infoRow('Mã đăng ký FDA', fdaInfo.fda_code) +
          infoRow('Mã DUNS', fdaInfo.fda_duns_code) +
          infoRow('Mã FEI', fdaInfo.fda_fei_code) +
          infoRow('Ngày cấp', new Date(fdaInfo.fda_issue_date).toLocaleDateString('vi-VN')) +
          infoRow('Ngày hết hạn', new Date(fdaInfo.fda_expiry_date).toLocaleDateString('vi-VN'))
        )}
        ` : ''}
        ${usAgentInfo ? `
        <h3 style="margin:16px 0 8px;font-size:14px;color:#0f766e;">Thông tin US Agent:</h3>
        ${infoTable(
          infoRow('Tên US Agent', usAgentInfo.us_agent_name) +
          infoRow('Ngày bắt đầu', new Date(usAgentInfo.us_agent_start_date).toLocaleDateString('vi-VN')) +
          infoRow('Ngày hết hạn', new Date(usAgentInfo.us_agent_expiry_date).toLocaleDateString('vi-VN'))
        )}
        <div style="background:#fefce8;border-left:4px solid #ca8a04;padding:12px;border-radius:4px;margin:8px 0;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#713f12;">
            <strong>Lưu y gia han:</strong> Dich vu US Agent cua ban se het han vao ngay 
            <strong>${new Date(usAgentInfo.us_agent_expiry_date).toLocaleDateString('vi-VN')}</strong>. 
            Vui long lien he voi chung toi truoc ngay nay de gia han va tranh gian doan dich vu dang ky FDA.
          </p>
        </div>
        ` : ''}
        ${note ? `
        <h3 style="margin:16px 0 8px;font-size:14px;color:#0f766e;">Thông tin từ nhân viên:</h3>
        <div style="background:#f8fafc;border-left:4px solid #0f766e;padding:12px;border-radius:4px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${note}</p>
        </div>
        ` : ''}
        <p style="font-size:14px;line-height:1.6;">Vui lòng đăng nhập vào hệ thống để xem thêm chi tiết.</p>
        ${button(`${getAppUrl()}/dashboard`, 'Xem chi tiết')}
      `,
    }),
  }),
}
