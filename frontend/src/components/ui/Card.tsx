import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-[#171717] border border-[#262626] rounded-lg p-5 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between pb-4 border-b border-[#262626] mb-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
