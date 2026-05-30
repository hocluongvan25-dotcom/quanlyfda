import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, testType = 'test' } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    let emailData

    if (testType === 'serviceCreated') {
      emailData = emailTemplates.serviceCreated('Thực phẩm', 'Nước ép trái cây ABC', to)
    } else if (testType === 'documentUploaded') {
      emailData = emailTemplates.documentUploaded('document.pdf', 'Service ABC')
    } else {
      emailData = emailTemplates.testEmail('User')
    }

    const result = await sendEmail({
      to,
      ...emailData,
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[v0] Error in email test route:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
