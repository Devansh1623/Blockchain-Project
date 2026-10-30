import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, ShieldAlert, Link2, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/transactions',  icon: List,            label: 'Transactions'   },
  { to: '/alerts',        icon: ShieldAlert,     label: 'Alerts'         },
  { to: '/audit',         icon: Link2,           label: 'Audit History'  },
];

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-surface border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={14} className="text-accent" />
        </div>
        <div>
          <span className="text-sm font-semibold text-text">ChainSleuth</span>
          <span className="block text-2xs text-text-3 -mt-0.5">Fraud Detection</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors group',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-2 hover:text-text hover:bg-surface-2',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-accent' : 'text-text-3 group-hover:text-text-2'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-accent/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-risk-low flex-shrink-0" />
          <span className="text-xs text-text-3">Demo Mode</span>
        </div>
        <p className="text-2xs text-text-4 mt-1 leading-relaxed">
          Research prototype · Not for production
        </p>
      </div>
    </aside>
  );
}
