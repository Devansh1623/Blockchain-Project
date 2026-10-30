import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowUpRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/ui/Table';
import { fetchAlerts } from '../services/api';
import type { Transaction, RiskCategory } from '../types';
import { toast } from 'sonner';

export function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState<RiskCategory | ''>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAlerts({
        page,
        page_size: 15,
        category: (category as RiskCategory) || undefined,
      });
      setAlerts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, category]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Security & Anomaly Alerts</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time queue of transactions flagged by the isolation forest anomaly detection engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#171717] border border-[#262626] rounded px-3 py-1.5 text-xs">
            <Filter size={13} className="text-neutral-500" />
            <span className="text-neutral-400 text-2xs uppercase">Severity:</span>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value as any);
                setPage(1);
              }}
              className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#171717]">All Flagged</option>
              <option value="CRITICAL" className="bg-[#171717]">Critical Only</option>
              <option value="HIGH" className="bg-[#171717]">High Risk Only</option>
              <option value="MEDIUM" className="bg-[#171717]">Medium Only</option>
              <option value="LOW" className="bg-[#171717]">Low Risk Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-xs flex flex-col items-center">
            <ShieldAlert size={32} className="text-neutral-600 mb-2 stroke-1" />
            <p>No transactions match the selected alert threshold.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Transaction ID</TableHeaderCell>
                <TableHeaderCell>From Wallet</TableHeaderCell>
                <TableHeaderCell>To Wallet</TableHeaderCell>
                <TableHeaderCell>Amount (ETH)</TableHeaderCell>
                <TableHeaderCell>Risk Score</TableHeaderCell>
                <TableHeaderCell>Primary Flag Reason</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map(tx => {
                const primaryReason = tx.risk_assessment?.explanation?.[0]?.factor || 'Statistical Outlier';
                return (
                  <TableRow
                    key={tx.id}
                    onClick={() => navigate(`/transactions/${tx.transaction_id}`)}
                  >
                    <TableCell className="font-mono text-neutral-200 font-medium">
                      {tx.transaction_id}
                    </TableCell>
                    <TableCell className="font-mono text-neutral-400">
                      {tx.from_wallet.slice(0, 8)}...{tx.from_wallet.slice(-6)}
                    </TableCell>
                    <TableCell className="font-mono text-neutral-400">
                      {tx.to_wallet.slice(0, 8)}...{tx.to_wallet.slice(-6)}
                    </TableCell>
                    <TableCell className="font-mono text-neutral-200 font-medium">
                      {tx.amount.toFixed(4)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      <span
                        className={
                          (tx.risk_assessment?.risk_score ?? 0) >= 80
                            ? 'text-red-400'
                            : (tx.risk_assessment?.risk_score ?? 0) >= 60
                            ? 'text-orange-400'
                            : 'text-amber-400'
                        }
                      >
                        {tx.risk_assessment?.risk_score ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-300 font-normal">
                      {primaryReason}
                    </TableCell>
                    <TableCell>
                      <Badge category={tx.risk_assessment?.risk_category || 'UNANALYZED'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="px-2">
                        Inspect <ArrowUpRight size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626] bg-[#141414] text-xs text-neutral-400">
          <div>
            Showing <span className="font-mono text-neutral-200">{alerts.length}</span> of{' '}
            <span className="font-mono text-neutral-200">{total}</span> alerts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="font-mono text-xs px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-2"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
