import Link from "next/link"
import { ShieldCheck, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Vexim Global</span>
          </div>
          <p className="text-muted-foreground text-center text-balance">
            Hệ thống quản lý dịch vụ đăng ký FDA
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl text-card-foreground">Không thể tự đăng ký</CardTitle>
            <CardDescription className="text-balance">
              Tài khoản truy cập hệ thống chỉ được tạo bởi quản trị viên hoặc nhân viên Vexim. Vui lòng liên hệ bộ phận hỗ trợ để được cấp tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">Quay lại đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
