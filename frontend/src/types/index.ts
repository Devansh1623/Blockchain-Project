// ─── Shared TypeScript types for ChainSleuth ──────────────────

export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExplanationFactor {
  factor: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RiskAssessment {
  id: string;
  transaction_id: string;
  risk_score: number;
  risk_category: RiskCategory;
  anomaly_score: number | null;
  explanation: ExplanationFactor[];
  model_version: string;
  created_at: string;
  disclaimer: string;
}

export interface AuditRecord {
  id: string;
  transaction_id: string;
  chain_id: number | null;
  contract_address: string | null;
  blockchain_tx_hash: string | null;
  record_status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  timestamp: string;
  source: string;
  created_at: string;
  risk_assessment?: RiskAssessment;
  audit_record?: AuditRecord;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RiskCategoryCount {
  category: RiskCategory;
  count: number;
}

export interface DashboardSummary {
  total_transactions: number;
  high_risk_count: number;
  critical_count: number;
  wallets_observed: number;
  risk_distribution: RiskCategoryCount[];
  recent_alerts: Transaction[];
  audit_count: number;
  model_version: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  model_loaded: boolean;
  model_version: string;
  blockchain_enabled: boolean;
}

export interface UploadResult {
  inserted: number;
  skipped_duplicates: number;
  warnings: string[];
  message: string;
}
