'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getDocumentCategoryLabel, type Document, type ServiceType } from '@/lib/types'
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Utensils,
  Sparkles,
  Stethoscope,
  FolderOpen,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { UploadDocumentDialog } from './upload-document-dialog'
import { SelectServiceDialog } from './select-service-dialog'

interface DocumentWithService extends Document {
  service?: {
    id: string
    product_name: string
    service_type: ServiceType
  }
}

function getServiceIcon(type: string) {
  switch (type) {
    case 'food':
      return <Utensils className="h-4 w-4 text-emerald-400" />
    case 'cosmetics':
      return <Sparkles className="h-4 w-4 text-fuchsia-400" />
    case 'medical_device':
      return <Stethoscope className="h-4 w-4 text-cyan-400" />
    default:
      return null
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function DocumentsManager() {
  const [documents, setDocuments] = useState<DocumentWithService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTypes, setFilterTypes] = useState<string[]>(['required', 'result'])

  useEffect(() => {
    async function fetchDocuments() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          service:services(id, product_name, service_type)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Error fetching documents:', error)
      } else {
        setDocuments(data as DocumentWithService[])
      }
      setIsLoading(false)
    }

    fetchDocuments()
  }, [])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.service?.product_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterTypes.includes(doc.document_type)
    return matchesSearch && matchesType
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-0"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Loại tài liệu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('required')}
                onCheckedChange={(checked) => {
                  setFilterTypes(prev =>
                    checked ? [...prev, 'required'] : prev.filter(s => s !== 'required')
                  )
                }}
              >
                Tài liệu yêu cầu
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('result')}
                onCheckedChange={(checked) => {
                  setFilterTypes(prev =>
                    checked ? [...prev, 'result'] : prev.filter(s => s !== 'result')
                  )
                }}
              >
                Tài liệu kết quả
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SelectServiceDialog />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Không tìm thấy tài liệu nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{doc.file_name}</p>
                      {doc.service && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getServiceIcon(doc.service.service_type)}
                          <span className="truncate max-w-[150px]">{doc.service.product_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={doc.document_type === 'result' ? 'default' : 'secondary'}>
                    {doc.document_type === 'result' ? 'Kết quả' : 'Yêu cầu'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Tải lên: {formatDate(doc.created_at)}
                  </p>
                  {doc.category && (
                    <Badge variant="outline" className="text-xs">
                      {getDocumentCategoryLabel(doc.category)}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {doc.file_url ? (
                    <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        Tải xuống
                      </a>
                    </Button>
                  ) : doc.service ? (
                    <UploadDocumentDialog 
                      serviceId={doc.service.id}
                      serviceName={doc.service.product_name}
                      trigger={
                        <Button size="sm" className="flex-1 gap-2">
                          <Upload className="h-4 w-4" />
                          Tải lên ngay
                        </Button>
                      }
                    />
                  ) : (
                    <Button size="sm" className="flex-1 gap-2" disabled>
                      <Upload className="h-4 w-4" />
                      Tải lên ngay
                    </Button>
                  )}
                  {doc.service && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/service/${doc.service.id}`}>
                        Xem dịch vụ
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
