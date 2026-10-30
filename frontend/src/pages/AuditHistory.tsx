import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/ui/Table';
import { fetchAuditRecords } from '../services/api';
import type { AuditRecord } from '../types';
import { toast } from 'sonner';

export function AuditHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditRecords();
      setRecords(data);
    } catch (err: any) {
      toast.error('Failed to load blockchain audit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-100">Blockchain Audit Ledger</h1>
            <Badge category="CONFIRMED" size="sm" />
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Immutable log of fraud findings committed to the ChainSleuthAudit smart contract on Sepolia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-neutral-400 bg-[#171717] px-3 py-1.5 rounded border border-[#262626] flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Smart Contract: ChainSleuthAudit.sol</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-xs flex flex-col items-center">
            <Link2 size={32} className="text-neutral-600 mb-2 stroke-1" />
            <p>No transactions have been recorded on the blockchain yet.</p>
            <p className="text-neutral-600 mt-1">
              Analyze transactions and use "Commit Finding to Smart Contract" on the transaction detail page.
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Transaction ID</TableHeaderCell>
                <TableHeaderCell>Chain ID</TableHeaderCell>
                <TableHeaderCell>Contract Address</TableHeaderCell>
                <TableHeaderCell>Tx Hash (Sepolia)</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Recorded At</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(rec => (
                <TableRow key={rec.id}>
                  <TableCell className="font-mono text-neutral-200 font-medium">
                    {rec.transaction_id}
                  </TableCell>
                  <TableCell className="font-mono text-neutral-400">
                    {rec.chain_id ?? 11155111}
                  </TableCell>
                  <TableCell className="font-mono text-neutral-400">
                    {rec.contract_address ? `${rec.contract_address.slice(0, 10)}...${rec.contract_address.slice(-6)}` : '0xMock...Audit'}
                  </TableCell>
                  <TableCell className="font-mono text-blue-400">
                    {rec.blockchain_tx_hash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${rec.blockchain_tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {rec.blockchain_tx_hash.slice(0, 10)}...{rec.blockchain_tx_hash.slice(-6)}
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-neutral-500">Local Test Hash</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge category={rec.record_status === 'confirmed' ? 'CONFIRMED' : 'PENDING'} />
                  </TableCell>
                  <TableCell className="font-mono text-2xs text-neutral-400">
                    {rec.created_at}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/transactions/${rec.transaction_id}`)}
                      className="px-2"
                    >
                      View Tx
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
