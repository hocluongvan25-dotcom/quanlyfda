import { del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role (only admin/staff can delete)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { documentId, pathname } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Delete from Vercel Blob if pathname exists
    if (pathname) {
      try {
        await del(pathname)
      } catch (blobError) {
        console.error('[v0] Error deleting blob:', blobError)
        // Continue to delete database record even if blob deletion fails
      }
    }

    // Delete document record from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      console.error('[v0] Error deleting document from database:', dbError)
      return NextResponse.json({ error: 'Failed to delete document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
