import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-4xl font-bold',
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className={cn('text-primary', sizeClasses[size])}>
        Vexim
      </span>
      <span className={cn('text-primary/60 text-xs font-semibold tracking-widest', {
        'sm:text-xs': size === 'sm',
        'text-xs': size === 'md',
        'text-sm': size === 'lg',
      })}>
        GLOBAL
      </span>
    </div>
  )
}
