'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthForm } from '@/components/auth-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <AuthForm mode="signup" />
      </div>
    </div>
  )
}
