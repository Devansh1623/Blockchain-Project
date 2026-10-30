import clsx from 'clsx';
import type { RiskCategory } from '../../types';

interface BadgeProps {
  category: RiskCategory | 'UNANALYZED' | 'CONFIRMED' | 'PENDING' | 'FAILED';
  className?: string;
  size?: 'sm' | 'md';
}

const variants: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  UNANALYZED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function Badge({ category, className, size = 'sm' }: BadgeProps) {
  const style = variants[category] || variants.UNANALYZED;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono font-medium border rounded uppercase tracking-wider',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        style,
        className
      )}
    >
      {category}
    </span>
  );
}
