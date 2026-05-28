import Link from 'next/link'
import { ShieldCheck, FileText, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Vexim Global</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dịch vụ
            </Link>
            <Link href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Quy trình
            </Link>
            <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Liên hệ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Đăng ký</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Dịch vụ đăng ký FDA chuyên nghiệp
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground text-pretty">
              Vexim Global - Đối tác tin cậy giúp doanh nghiệp Việt Nam tiếp cận thị trường Hoa Kỳ. 
              Chúng tôi cung cấp dịch vụ đăng ký FDA cho thực phẩm, mỹ phẩm và thiết bị y tế.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Bắt đầu ngay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#services">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Tìm hiểu thêm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Dịch vụ của chúng tôi</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Chúng tôi cung cấp đầy đủ các dịch vụ đăng ký FDA cho ba loại sản phẩm chính
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Thực phẩm</CardTitle>
                <CardDescription>Food Facility Registration</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Đăng ký cơ sở sản xuất thực phẩm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Dịch vụ US Agent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Prior Notice hỗ trợ xuất khẩu</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mỹ phẩm</CardTitle>
                <CardDescription>VCRP Registration</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Đăng ký cơ sở sản xuất mỹ phẩm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Đăng ký sản phẩm VCRP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Đánh giá nhãn và thành phần</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Thiết bị y tế</CardTitle>
                <CardDescription>Medical Device Registration</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Đăng ký thiết bị y tế Class I/II</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Hỗ trợ hồ sơ 510(k)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Listing sản phẩm</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Quy trình làm việc</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Theo dõi tiến độ đăng ký FDA của bạn theo thời gian thực
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản và gửi yêu cầu dịch vụ' },
              { step: 2, title: 'Nộp hồ sơ', desc: 'Tải lên các tài liệu cần thiết' },
              { step: 3, title: 'Theo dõi tiến độ', desc: 'Xem trạng thái xử lý theo thời gian thực' },
              { step: 4, title: 'Nhận kết quả', desc: 'Nhận mã số FDA và tài liệu hoàn tất' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Quản lý dịch vụ đăng ký FDA dễ dàng
              </h2>
              <p className="mt-4 text-muted-foreground">
                Hệ thống của chúng tôi giúp bạn theo dõi và quản lý toàn bộ quy trình đăng ký FDA 
                một cách minh bạch và hiệu quả.
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  { icon: Clock, text: 'Theo dõi tiến độ theo thời gian thực' },
                  { icon: FileText, text: 'Quản lý tài liệu tập trung' },
                  { icon: ShieldCheck, text: 'Nhận thông báo gia hạn kịp thời' },
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-muted rounded-xl p-8">
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Tiến độ đăng ký</span>
                    <span className="text-sm text-primary font-medium">75%</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">Giai đoạn hiện tại</div>
                  <div className="mt-1 font-medium text-foreground">Nộp FDA - Đang xử lý</div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">Tài liệu mới</div>
                  <div className="mt-1 font-medium text-foreground">Giấy xác nhận đã nhận</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
            Đăng ký tài khoản ngay hôm nay để bắt đầu quy trình đăng ký FDA cho sản phẩm của bạn.
          </p>
          <div className="mt-8">
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary">
                Đăng ký miễn phí
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-lg font-bold">Vexim Global</span>
              </div>
              <p className="mt-4 text-sm text-background/70">
                Dịch vụ đăng ký FDA chuyên nghiệp cho doanh nghiệp Việt Nam.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Dịch vụ</h3>
              <ul className="space-y-2 text-sm text-background/70">
                <li>Đăng ký thực phẩm</li>
                <li>Đăng ký mỹ phẩm</li>
                <li>Đăng ký thiết bị y tế</li>
                <li>US Agent</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-background/70">
                <li>Hướng dẫn sử dụng</li>
                <li>Câu hỏi thường gặp</li>
                <li>Liên hệ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-sm text-background/70">
                <li>Email: contact@veximglobal.com</li>
                <li>Hotline: 1900-xxxx</li>
                <li>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-background/20 text-center text-sm text-background/50">
            <p>&copy; {new Date().getFullYear()} Vexim Global. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
