import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getServiceTypeLabel } from '@/lib/types'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get all documents with their associated service info
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      services:service_id (
        id,
        product_name,
        service_type
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const customerDocs = documents?.filter(d => d.uploaded_by === 'customer') || []
  const veximDocs = documents?.filter(d => d.uploaded_by === 'vexim') || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý tài liệu</h1>
        <p className="text-muted-foreground">Xem và tải lên tài liệu cho các dịch vụ</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng tài liệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{documents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tài liệu của bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{customerDocs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Từ Vexim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{veximDocs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả tài liệu</CardTitle>
          <CardDescription>Danh sách tất cả tài liệu theo dịch vụ</CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Chưa có tài liệu nào
              </h3>
              <p className="text-muted-foreground mb-4">
                Tải lên tài liệu từ trang chi tiết dịch vụ
              </p>
              <Link href="/dashboard/services">
                <Button variant="outline">Xem dịch vụ</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      doc.uploaded_by === 'vexim' ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        doc.uploaded_by === 'vexim' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{doc.document_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Link
                          href={`/dashboard/services/${doc.service_id}`}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {doc.services?.product_name}
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {doc.services?.service_type && getServiceTypeLabel(doc.services.service_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {doc.uploaded_by === 'vexim' ? 'Từ Vexim' : 'Của bạn'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
