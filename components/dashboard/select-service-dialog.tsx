'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { getServices } from '@/app/actions/services'
import type { Service } from '@/lib/types'
import { Building2, Loader2 } from 'lucide-react'
import { UploadDocumentDialog } from './upload-document-dialog'

export function SelectServiceDialog() {
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setLoadingServices(true)
      getServices()
        .then(setServices)
        .catch(console.error)
        .finally(() => setLoadingServices(false))
      setSelectedService('')
    }
  }

  const handleContinue = () => {
    if (selectedService) {
      setShowUploadDialog(true)
      setOpen(false)
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  return (
    <>
      <Button className="gap-2" onClick={() => handleOpenChange(true)}>
        Upload
        Tải lên
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn Dịch vụ</DialogTitle>
            <DialogDescription>
              Chọn dịch vụ mà bạn muốn tải lên tài liệu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingServices ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách dịch vụ...
              </div>
            ) : services.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-secondary rounded-lg">
                <Building2 className="h-4 w-4 inline-block mr-2" />
                Chưa có dịch vụ nào. Hãy tạo dịch vụ trước.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="service">Dịch vụ *</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center gap-2">
                            <span>{service.product_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({service.client_id})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleContinue} disabled={!selectedService}>
                    Tiếp tục
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedServiceData && (
        <UploadDocumentDialog
          serviceId={selectedService}
          serviceName={selectedServiceData.product_name}
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
        />
      )}
    </>
  )
}
