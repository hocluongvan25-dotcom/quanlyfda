import { getProfile } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/dashboard/profile-form'

export default async function SettingsPage() {
  const profile = await getProfile()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và doanh nghiệp</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin cá nhân và liên hệ của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin doanh nghiệp</CardTitle>
          <CardDescription>Thông tin về công ty của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tên công ty</p>
              <p className="font-medium text-foreground">
                {profile?.company_name || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">
                {profile?.email || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
              <p className="font-medium text-foreground">
                {profile?.phone || 'Chưa cập nhật'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
              <p className="font-medium text-foreground">
                {profile?.address || 'Chưa cập nhật'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
