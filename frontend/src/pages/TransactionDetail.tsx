import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Lock, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchTransaction, submitAuditRecord } from '../services/api';
import type { Transaction } from '../types';
import { toast } from 'sonner';

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAudit, setSubmittingAudit] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchTransaction(id);
      setTx(data);
    } catch (err: any) {
      toast.error('Transaction not found');
      navigate('/transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRecordOnChain = async () => {
    if (!tx) return;
    try {
      setSubmittingAudit(true);
      await submitAuditRecord(tx.transaction_id);
      toast.success('Finding successfully recorded on-chain!');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit audit record to smart contract');
    } finally {
      setSubmittingAudit(false);
    }
  };

  if (loading || !tx) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const risk = tx.risk_assessment;
  const audit = tx.audit_record;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft size={14} /> Back to list
        </button>
      </div>

      {/* Main Details header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-mono font-semibold text-neutral-100">{tx.transaction_id}</h1>
            <Badge category={risk?.risk_category || 'UNANALYZED'} size="md" />
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Transferred at <span className="font-mono text-neutral-300">{tx.timestamp}</span> · Ingestion Source: <span className="font-mono text-neutral-300">{tx.source}</span>
          </p>
        </div>

        {risk && !audit && (
          <Button
            variant="primary"
            onClick={handleRecordOnChain}
            loading={submittingAudit}
          >
            <Lock size={14} />
            Commit Finding to Smart Contract
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Features */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Transaction Attributes" description="Verified transfer parameters" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#121212] rounded border border-[#222]">
                <div className="text-2xs text-neutral-500 uppercase font-mono">From Sender Address</div>
                <div className="flex items-center justify-between mt-1.5 font-mono text-neutral-200 break-all">
                  <span>{tx.from_wallet}</span>
                  <button
                    onClick={() => copyToClipboard(tx.from_wallet, 'from')}
                    className="p-1 hover:text-white text-neutral-500 ml-2"
                  >
                    {copiedKey === 'from' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#121212] rounded border border-[#222]">
                <div className="text-2xs text-neutral-500 uppercase font-mono">To Recipient Address</div>
                <div className="flex items-center justify-between mt-1.5 font-mono text-neutral-200 break-all">
                  <span>{tx.to_wallet}</span>
                  <button
                    onClick={() => copyToClipboard(tx.to_wallet, 'to')}
                    className="p-1 hover:text-white text-neutral-500 ml-2"
                  >
                    {copiedKey === 'to' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#121212] rounded border border-[#222]">
                <div className="text-2xs text-neutral-500 uppercase font-mono">Transfer Amount</div>
                <div className="text-lg font-mono font-semibold text-neutral-100 mt-1">
                  {tx.amount.toFixed(4)} <span className="text-xs text-neutral-400 font-normal">ETH</span>
                </div>
              </div>

              <div className="p-3 bg-[#121212] rounded border border-[#222]">
                <div className="text-2xs text-neutral-500 uppercase font-mono">Ingested Record ID</div>
                <div className="text-xs font-mono text-neutral-400 mt-1 truncate">{tx.id}</div>
              </div>
            </div>
          </Card>

          {/* AI / ML Risk Explanation Card */}
          <Card>
            <CardHeader
              title="Explainability & Risk Factor Breakdown"
              description="Algorithmic rationale produced by Isolation Forest feature inspection"
            />
            {!risk ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                This transaction has not yet been processed by the anomaly detection pipeline.
              </div>
            ) : (
              <div className="space-y-3">
                {risk.explanation && risk.explanation.length > 0 ? (
                  risk.explanation.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#121212] rounded border border-[#242424] flex items-start gap-3"
                    >
                      <AlertCircle
                        size={16}
                        className={
                          item.severity === 'high'
                            ? 'text-red-400 flex-shrink-0 mt-0.5'
                            : item.severity === 'medium'
                            ? 'text-amber-400 flex-shrink-0 mt-0.5'
                            : 'text-neutral-400 flex-shrink-0 mt-0.5'
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-200">{item.factor}</span>
                          <span className="text-2xs font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{item.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-neutral-400">
                    No anomalous deviations flagged. Transaction metrics align with baseline normal behavior.
                  </div>
                )}

                <div className="text-2xs text-neutral-500 pt-2 border-t border-[#222]">
                  {risk.disclaimer}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Risk Gauge & Smart Contract Audit Status */}
        <div className="space-y-6">
          {/* Risk Gauge Card */}
          <Card className="text-center">
            <CardHeader title="Calculated Risk Score" className="border-b-0 pb-0" />
            <div className="py-6 flex flex-col items-center">
              <div
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center ${
                  !risk
                    ? 'border-neutral-700'
                    : risk.risk_score >= 80
                    ? 'border-red-500 bg-red-500/10'
                    : risk.risk_score >= 60
                    ? 'border-orange-500 bg-orange-500/10'
                    : risk.risk_score >= 30
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-emerald-500 bg-emerald-500/10'
                }`}
              >
                <span className="text-3xl font-mono font-bold text-neutral-100">
                  {risk ? risk.risk_score : '—'}
                </span>
                <span className="text-2xs font-mono text-neutral-400 uppercase">/ 100</span>
              </div>
              <div className="mt-4">
                <Badge category={risk?.risk_category || 'UNANALYZED'} size="md" />
              </div>
              {risk && (
                <div className="mt-4 text-2xs font-mono text-neutral-500 space-y-1">
                  <div>Raw Anomaly Score: {risk.anomaly_score?.toFixed(5) ?? 'N/A'}</div>
                  <div>Model Version: {risk.model_version}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Blockchain Smart Contract Card */}
          <Card>
            <CardHeader title="Smart Contract Proof" description="Tamper-evident record status" />
            {audit ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileCheck2 size={16} />
                  <span className="font-semibold">Recorded On-Chain</span>
                </div>
                <div className="space-y-2 font-mono text-2xs text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block">Status:</span>
                    <Badge category={audit.record_status === 'confirmed' ? 'CONFIRMED' : 'PENDING'} />
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Chain ID:</span>
                    <span>{audit.chain_id ?? 11155111} (Sepolia Testnet)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Contract Address:</span>
                    <span className="break-all text-neutral-400">
                      {audit.contract_address || '0xChainSleuthAuditMockDeployAddress'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Blockchain Tx Hash:</span>
                    <div className="flex items-center gap-1.5 break-all text-blue-400 mt-0.5">
                      <span>{audit.blockchain_tx_hash}</span>
                      {audit.blockchain_tx_hash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${audit.blockchain_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-300"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Timestamp:</span>
                    <span>{audit.created_at}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3 text-xs text-neutral-400">
                <Lock size={24} className="mx-auto text-neutral-600 stroke-1" />
                <p>No immutable record exists on the blockchain yet for this transaction.</p>
                {risk && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleRecordOnChain}
                    loading={submittingAudit}
                  >
                    Record Finding on Sepolia
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
