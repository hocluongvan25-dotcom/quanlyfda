'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Shield,
  Users,
  Building2,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Trash2,
} from 'lucide-react'
import { Profile } from '@/lib/types'
import { getAllUsers, updateUserRole, createStaffMember, createClientProfile, deleteUser } from '@/app/actions/services'

const roleLabels: Record<string, string> = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  client: 'Khách hàng',
}

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  staff: 'secondary',
  client: 'outline',
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email?.charAt(0).toUpperCase() || 'U'
}

export function UsersManagement() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form states
  const [newUserType, setNewUserType] = useState<'client' | 'staff'>('client')
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    phone: '',
    role: 'staff' as 'staff' | 'admin',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'clients') return matchesSearch && user.role === 'client'
    if (activeTab === 'staff') return matchesSearch && (user.role === 'staff' || user.role === 'admin')
    return matchesSearch
  })

  const handleCreateUser = async () => {
    setIsSubmitting(true)
    try {
      if (newUserType === 'client') {
        await createClientProfile({
          email: formData.email,
          full_name: formData.full_name,
          company_name: formData.company_name,
          phone: formData.phone,
        })
      } else {
        await createStaffMember({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
        })
      }
      await loadUsers()
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Không thể tạo người dùng. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRole = async (newRole: 'admin' | 'staff' | 'client') => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await updateUserRole(selectedUser.id, newRole)
      await loadUsers()
      setShowRoleDialog(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Không thể cập nhật quyền. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await deleteUser(selectedUser.id)
      await loadUsers()
      setShowDeleteDialog(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Không thể xóa người dùng. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      company_name: '',
      phone: '',
      role: 'staff',
    })
  }

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === 'client').length,
    staff: users.filter((u) => u.role === 'staff' || u.role === 'admin').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staff}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Danh sách người dùng</CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="clients">Khách hàng</TabsTrigger>
                <TabsTrigger value="staff">Nhân viên</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy người dùng nào
                </div>
              ) : (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Liên hệ</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(user.full_name, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.full_name || user.email}
                                </div>
                                {user.company_name && (
                                  <div className="text-sm text-muted-foreground">
                                    {user.company_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariants[user.role || 'client']}>
                              {roleLabels[user.role || 'client']}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at!).toLocaleDateString('vi-VN')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowRoleDialog(true)
                                  }}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Thay đổi quyền
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Xóa người dùng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới cho khách hàng hoặc nhân viên
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại tài khoản</Label>
              <Select
                value={newUserType}
                onValueChange={(v) => setNewUserType(v as 'client' | 'staff')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Khách hàng</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ tên</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            {newUserType === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Tên công ty</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Công ty ABC"
                />
              </div>
            )}
            {newUserType === 'staff' && (
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v as 'staff' | 'admin' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Nhân viên</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0123 456 789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateUser} disabled={!formData.email || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi quyền</DialogTitle>
            <DialogDescription>
              Thay đổi vai trò cho {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedUser && getInitials(selectedUser.full_name, selectedUser.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedUser?.full_name || selectedUser?.email}</div>
                <div className="text-sm text-muted-foreground">
                  Vai trò hiện tại: {roleLabels[selectedUser?.role || 'client']}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chọn vai trò mới</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedUser?.role === 'client' ? 'default' : 'outline'}
                  onClick={() => handleUpdateRole('client')}
                  disabled={isSubmitting}
                  className="flex-col h-auto py-3"
                >
                  <Building2 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Khách hàng</span>
                </Button>
                <Button
                  variant={selectedUser?.role === 'staff' ? 'default' : 'outline'}
                  onClick={() => handleUpdateRole('staff')}
                  disabled={isSubmitting}
                  className="flex-col h-auto py-3"
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-xs">Nhân viên</span>
                </Button>
                <Button
                  variant={selectedUser?.role === 'admin' ? 'default' : 'outline'}
                  onClick={() => handleUpdateRole('admin')}
                  disabled={isSubmitting}
                  className="flex-col h-auto py-3"
                >
                  <Shield className="h-5 w-5 mb-1" />
                  <span className="text-xs">Quản trị</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-destructive/20 text-destructive">
                {selectedUser && getInitials(selectedUser.full_name, selectedUser.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{selectedUser?.full_name || selectedUser?.email}</div>
              <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa người dùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
