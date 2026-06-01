import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={cn('flex items-center', className)}>
      <span className={cn('text-primary font-bold tracking-wider', sizeClasses[size])}>
        VEXIM GLOBAL
      </span>
    </div>
  )
}
