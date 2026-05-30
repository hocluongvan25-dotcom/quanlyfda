"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  // The recovery link sets a session in the URL. The Supabase client detects it
  // automatically; we listen for the auth state to know when it's ready.
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION"))) {
        setSessionReady(true)
        setChecking(false)
      }
    })

    // Fallback: check for an existing session shortly after mount.
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setSessionReady(true)
      }
      setChecking(false)
    }, 1500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Vexim Global</span>
          </div>
          <p className="text-muted-foreground text-center text-balance">
            Thiết lập mật khẩu cho tài khoản của bạn
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-card-foreground">Đặt mật khẩu</CardTitle>
            <CardDescription>Nhập mật khẩu mới để hoàn tất thiết lập tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Đang xác thực liên kết...</span>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <p className="text-card-foreground font-medium">Đặt mật khẩu thành công!</p>
                <p className="text-sm text-muted-foreground">Đang chuyển đến trang quản lý...</p>
              </div>
            ) : !sessionReady ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu quản trị viên gửi lại email
                    thiết lập mật khẩu.
                  </span>
                </div>
                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-input"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Đặt mật khẩu"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
