'use client'

import { Bell, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

function getRoleBadge(roleName: string | undefined | null) {
  switch (roleName) {
    case 'admin':
      return { label: 'Admin', className: 'bg-red-100 text-red-800 border-red-200' }
    case 'staff':
      return { label: 'Nhân viên', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'customer':
    default:
      return { label: 'Khách hàng', className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const roleBadge = getRoleBadge(profile?.roles?.name)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="lg:hidden" /> {/* Spacer for mobile menu button */}
        
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <h1 className="text-lg font-semibold text-foreground">
            {profile?.company_name || 'Dashboard'}
          </h1>
          <Badge variant="outline" className={roleBadge.className}>
            {profile?.roles?.name === 'admin' && <ShieldCheck className="mr-1 h-3 w-3" />}
            {roleBadge.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Thông báo</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.full_name || 'Người dùng'}
                  </p>
                  <Badge variant="outline" className={`text-xs ${roleBadge.className}`}>
                    {roleBadge.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Cài đặt tài khoản
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
