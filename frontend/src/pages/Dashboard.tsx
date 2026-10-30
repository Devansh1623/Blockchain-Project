import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  ArrowUpRight, 
  Wallet, 
  FileCheck2, 
  Layers, 
  Zap, 
  UploadCloud,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/ui/Table';
import { fetchDashboard, analyzeTransactions } from '../services/api';
import type { DashboardSummary } from '../types';
import { toast } from 'sonner';

const COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await fetchDashboard();
      setData(summary);
    } catch (err: any) {
      toast.error('Failed to load dashboard metrics. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await analyzeTransactions();
      toast.success(res.message || `Analyzed ${res.analyzed} transactions successfully.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Analysis failed. Upload transactions first.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-1" />
          <Skeleton className="h-72 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const chartData = (data?.risk_distribution || []).map(d => ({
    name: d.category,
    value: d.count,
    color: COLORS[d.category] || '#71717a',
  }));

  const totalFlagged = (data?.high_risk_count ?? 0) + (data?.critical_count ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Fraud Overview & Intelligence</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time isolation forest anomaly detection pipeline with cryptographic audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/transactions')}>
            <UploadCloud size={14} />
            Upload CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleRunAnalysis} loading={analyzing}>
            <Zap size={14} />
            Run ML Detection
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Total Transactions</span>
            <Layers size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-neutral-100 mt-2">
            {data?.total_transactions.toLocaleString() ?? 0}
          </div>
          <span className="text-2xs text-neutral-500 mt-1 block">Ingested on-chain dataset</span>
        </Card>

        <Card className="hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Suspicious Flagged</span>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-mono font-semibold text-red-400 mt-2">
            {totalFlagged.toLocaleString()}
          </div>
          <span className="text-2xs text-neutral-500 mt-1 block">
            {data?.critical_count ?? 0} Critical · {data?.high_risk_count ?? 0} High Risk
          </span>
        </Card>

        <Card className="hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Observed Wallets</span>
            <Wallet size={16} className="text-neutral-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-neutral-100 mt-2">
            {data?.wallets_observed.toLocaleString() ?? 0}
          </div>
          <span className="text-2xs text-neutral-500 mt-1 block">Unique sender/receiver nodes</span>
        </Card>

        <Card className="hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">On-Chain Audit Records</span>
            <FileCheck2 size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-semibold text-blue-400 mt-2">
            {data?.audit_count.toLocaleString() ?? 0}
          </div>
          <span className="text-2xs text-neutral-500 mt-1 block">Recorded on Sepolia Contract</span>
        </Card>
      </div>

      {/* Charts & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader title="Risk Category Distribution" description="Transactions categorized by ML risk score" />
          {chartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 text-xs">
              No transactions analyzed yet. Run ML detection above.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-2">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#171717" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f1f1f',
                        borderColor: '#333',
                        fontSize: '12px',
                        borderRadius: '4px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-3 px-2">
                {chartData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-[#202020]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-neutral-300 font-mono text-2xs">{d.name}</span>
                    </div>
                    <span className="font-mono text-neutral-400 font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Recent Alerts Card */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="High & Critical Anomaly Alerts"
            description="Recent transactions exceeding anomaly risk threshold"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')}>
                View all alerts <ArrowUpRight size={13} />
              </Button>
            }
          />

          {!data?.recent_alerts || data.recent_alerts.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              No high-risk alerts detected in the current dataset.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Tx ID</TableHeaderCell>
                  <TableHeaderCell>From / To</TableHeaderCell>
                  <TableHeaderCell>Amount (ETH)</TableHeaderCell>
                  <TableHeaderCell>Risk Score</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell className="text-right">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recent_alerts.slice(0, 6).map(tx => (
                  <TableRow key={tx.id} onClick={() => navigate(`/transactions/${tx.transaction_id}`)}>
                    <TableCell className="font-mono text-neutral-200 font-medium">
                      {tx.transaction_id}
                    </TableCell>
                    <TableCell className="font-mono text-neutral-400">
                      <div>{tx.from_wallet.slice(0, 8)}...{tx.from_wallet.slice(-6)}</div>
                      <div className="text-2xs text-neutral-500">→ {tx.to_wallet.slice(0, 8)}...{tx.to_wallet.slice(-6)}</div>
                    </TableCell>
                    <TableCell className="font-mono text-neutral-200 font-medium">
                      {tx.amount.toFixed(4)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      <span className={tx.risk_assessment?.risk_score && tx.risk_assessment.risk_score >= 80 ? 'text-red-400' : 'text-orange-400'}>
                        {tx.risk_assessment?.risk_score ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge category={tx.risk_assessment?.risk_category || 'UNANALYZED'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="px-2">
                        <ChevronRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Model & Disclaimer Footnote */}
      <div className="p-4 rounded border border-neutral-800 bg-[#141414] text-neutral-400 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-neutral-400 flex-shrink-0" />
          <span>
            Model: <strong className="text-neutral-200">{data?.model_version || 'IsolationForest-v1.0'}</strong> · Unsupervised anomaly isolation based on amount z-score, velocity, and recipient network dispersion.
          </span>
        </div>
        <span className="text-2xs font-mono text-neutral-500">Research Prototype</span>
      </div>
    </div>
  );
}
