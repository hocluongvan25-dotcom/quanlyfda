import Image from "next/image"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <Image
          src="/images/logo-vexim.png"
          alt="Vexim Global"
          width={200}
          height={100}
          className="mx-auto object-contain"
          priority
        />
        <h1 className="text-3xl font-bold text-foreground">Trợ giúp & Hỗ trợ</h1>
        <p className="text-muted-foreground">
          Cần hỗ trợ về dịch vụ đăng ký FDA? Vui lòng liên hệ với chúng tôi qua các kênh sau:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 text-left">
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Email</h3>
            <p className="text-muted-foreground">support@veximglobal.com</p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Hotline</h3>
            <p className="text-muted-foreground">+84 28 1234 5678</p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Giờ làm việc</h3>
            <p className="text-muted-foreground">Thứ 2 - Thứ 6: 8:00 - 17:30</p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Địa chỉ</h3>
            <p className="text-muted-foreground">TP. Hồ Chí Minh, Việt Nam</p>
          </div>
        </div>
      </div>
    </div>
  )
}
