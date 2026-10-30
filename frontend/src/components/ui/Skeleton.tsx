import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded bg-neutral-800/80 border border-neutral-700/30',
        className
      )}
    />
  );
}
