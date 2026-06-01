import { Suspense } from "react"
import { PasswordForm } from "./password-form"

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    }>
      <PasswordForm />
    </Suspense>
  )
}

