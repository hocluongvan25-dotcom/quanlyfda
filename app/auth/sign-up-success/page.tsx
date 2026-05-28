import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function SignUpSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle>Đăng ký thành công</CardTitle>
          <CardDescription>Chào mừng bạn đến với Vexim Global</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">Vui lòng xác nhận email của bạn</p>
            <p className="text-muted-foreground">
              Chúng tôi đã gửi một liên kết xác nhận đến địa chỉ email của bạn. 
              Hãy nhấp vào liên kết để xác minh tài khoản và hoàn thành đăng ký.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Không nhận được email?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kiểm tra thư mục spam/junk</li>
              <li>Đảm bảo email bạn nhập chính xác</li>
            </ul>
          </div>

          <Button asChild className="w-full">
            <Link href="/auth/login">Quay lại Đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
