"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { clearForcePasswordChange } from "@/app/actions/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if this is a forced password change (from temp password login)
  const isForced = searchParams.get('force') === 'true'

  // The recovery link sets a session in the URL. The Supabase client detects it
  // automatically; we listen for the auth state to know when it's ready.
  useEffect(() => {
    const supabase = createClient()

    // If forced, we already have a session from login
    if (isForced) {
      setSessionReady(true)
      setChecking(false)
      return
    }

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
  }, [isForced])

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

    // Clear force_password_change flag if this was a forced change
    if (isForced) {
      try {
        await clearForcePasswordChange()
      } catch (e) {
        console.error('Error clearing force password flag:', e)
      }
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
          <Image
            src="/images/logo-vexim.png"
            alt="Vexim Global"
            width={250}
            height={120}
            priority
            className="mb-4"
          />
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-card-foreground">
              {isForced ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
            </CardTitle>
            <CardDescription>
              {isForced 
                ? 'Vui lòng đặt mật khẩu mới để bảo mật tài khoản của bạn' 
                : 'Nhập mật khẩu mới để hoàn tất thiết lập tài khoản'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Đang xác thực...</span>
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

                {isForced && (
                  <div className="flex items-start gap-2 p-3 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Quản trị viên đã đặt mật khẩu tạm thời cho bạn. Vui lòng đặt mật khẩu mới để tiếp tục sử dụng hệ thống.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
