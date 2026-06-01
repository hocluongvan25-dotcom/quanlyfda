import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoIcon({ size = 'md', className }: LogoIconProps) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Globe
        size={sizeMap[size]}
        className="text-emerald-500 stroke-1"
        strokeWidth={1.5}
      />
    </div>
  );
}
