import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  Zap, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/ui/Table';
import { fetchTransactions, uploadCSV, analyzeTransactions } from '../services/api';
import type { Transaction, RiskCategory } from '../types';
import { toast } from 'sonner';

export function Transactions() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskCategory | ''>('');
  const [sortBy, setSortBy] = useState<'amount' | 'created_at' | 'risk_score'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchTransactions({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        risk: (riskFilter as RiskCategory) || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      setTransactions(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, riskFilter, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadCSV(file);
      toast.success(res.message || `Uploaded ${res.inserted} transactions successfully!`);
      if (res.skipped_duplicates > 0) {
        toast.info(`Skipped ${res.skipped_duplicates} duplicate transactions.`);
      }
      setPage(1);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'CSV upload failed. Check file format.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await analyzeTransactions();
      toast.success(res.message || `Analyzed ${res.analyzed} transactions successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Transaction Registry</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Browse, filter, and run anomaly models across ingested blockchain transfers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <Upload size={14} />
            Import CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAnalysis}
            loading={analyzing}
          >
            <Zap size={14} />
            Analyze Unscored
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search Tx ID, From, or To wallet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111] border border-[#2a2a2a] focus:border-blue-500 focus:outline-none rounded text-xs pl-9 pr-3 py-2 text-neutral-200 placeholder-neutral-500"
              />
            </div>
            <Button variant="secondary" size="sm" type="submit">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#111] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs">
              <Filter size={13} className="text-neutral-500" />
              <span className="text-neutral-400 text-2xs uppercase">Risk:</span>
              <select
                value={riskFilter}
                onChange={e => {
                  setRiskFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#171717]">All</option>
                <option value="CRITICAL" className="bg-[#171717]">Critical</option>
                <option value="HIGH" className="bg-[#171717]">High</option>
                <option value="MEDIUM" className="bg-[#171717]">Medium</option>
                <option value="LOW" className="bg-[#171717]">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#111] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs">
              <ArrowUpDown size={13} className="text-neutral-500" />
              <span className="text-neutral-400 text-2xs uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="created_at" className="bg-[#171717]">Date</option>
                <option value="amount" className="bg-[#171717]">Amount</option>
                <option value="risk_score" className="bg-[#171717]">Risk Score</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                className="text-neutral-400 hover:text-neutral-200 font-mono text-2xs uppercase px-1"
              >
                {sortDir}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-xs flex flex-col items-center">
            <FileSpreadsheet size={32} className="text-neutral-600 mb-2 stroke-1" />
            <p>No transactions found matching your criteria.</p>
            <p className="text-neutral-600 mt-1">Upload a CSV or reset your search filters.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Transaction ID</TableHeaderCell>
                <TableHeaderCell>From Address</TableHeaderCell>
                <TableHeaderCell>To Address</TableHeaderCell>
                <TableHeaderCell>Amount (ETH)</TableHeaderCell>
                <TableHeaderCell>Timestamp</TableHeaderCell>
                <TableHeaderCell>Risk Score</TableHeaderCell>
                <TableHeaderCell>Classification</TableHeaderCell>
                <TableHeaderCell>On-Chain</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map(tx => (
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
                  <TableCell className="font-mono text-neutral-400 text-2xs">
                    {tx.timestamp}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {tx.risk_assessment ? (
                      <span
                        className={
                          tx.risk_assessment.risk_score >= 80
                            ? 'text-red-400'
                            : tx.risk_assessment.risk_score >= 60
                            ? 'text-orange-400'
                            : tx.risk_assessment.risk_score >= 30
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {tx.risk_assessment.risk_score}
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge category={tx.risk_assessment?.risk_category || 'UNANALYZED'} />
                  </TableCell>
                  <TableCell>
                    {tx.audit_record ? (
                      <Badge category="CONFIRMED" size="sm" />
                    ) : (
                      <span className="text-neutral-600 text-2xs font-mono">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626] bg-[#141414] text-xs text-neutral-400">
          <div>
            Showing <span className="font-mono text-neutral-200">{transactions.length}</span> of{' '}
            <span className="font-mono text-neutral-200">{total}</span> records
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
