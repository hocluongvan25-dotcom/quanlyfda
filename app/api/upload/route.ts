import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const serviceId = formData.get('serviceId') as string
    const documentType = formData.get('documentType') as string || 'required'
    const category = formData.get('category') as string || null
    const stage = formData.get('stage') as string || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    // Upload to Vercel Blob (public storage)
    const blob = await put(`documents/${serviceId}/${file.name}`, file, {
      access: 'public',
    })

    // Save document record to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        service_id: serviceId,
        uploaded_by: user.id,
        document_type: documentType,
        category: category,
        file_name: file.name,
        file_url: blob.url, // Store full URL for public blobs
        file_size: file.size,
        mime_type: file.type,
        stage: stage,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[v0] Error saving document to database:', dbError)
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      document,
      url: blob.url 
    })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
