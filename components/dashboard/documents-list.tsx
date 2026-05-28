'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Download, Trash2 } from 'lucide-react'

interface Document {
  id: string
  document_name: string
  document_type: string
  uploaded_by: string
  file_size: number
  created_at: string
  file_url: string
}

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      const supabase = createClient()
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setDocuments(data || [])
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
  }

  if (documents.length === 0) {
    return (
      <Empty
        icon="FileText"
        title="Không có tài liệu nào"
        description="Tải lên tài liệu cho dịch vụ của bạn"
      />
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{doc.document_name}</CardTitle>
              </div>
              <Badge variant={doc.document_type === 'upload' ? 'default' : 'secondary'}>
                {doc.document_type === 'upload' ? 'Đã tải lên' : 'Tải xuống'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Kích thước</p>
                <p className="font-medium">{formatFileSize(doc.file_size)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Người tải</p>
                <p className="font-medium">{doc.uploaded_by === 'customer' ? 'Bạn' : 'Vexim'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ngày tải</p>
                <p className="font-medium">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={doc.file_url} download>
                  <Download className="mr-2 h-4 w-4" />
                  Tải xuống
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
