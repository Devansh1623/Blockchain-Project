import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <header className="h-14 border-b border-neutral-800/80 bg-[#141414]/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-neutral-400">NETWORK: SEPOLIA (TESTNET DEMO)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded border border-neutral-700">
              IsolationForest v1.0.0
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
