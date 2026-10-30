import React from 'react';
import clsx from 'clsx';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={clsx('w-full text-left text-xs border-collapse', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={clsx('border-b border-[#262626] text-neutral-400 uppercase font-mono text-2xs', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={clsx('divide-y divide-[#222222]', className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'transition-colors',
        onClick && 'hover:bg-neutral-800/40 cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={clsx('py-3 px-3 text-neutral-300 font-normal', className)}>{children}</td>;
}

export function TableHeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={clsx('py-2.5 px-3 font-medium tracking-wider', className)}>{children}</th>;
}
