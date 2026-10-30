import axios from 'axios';
import type {
  DashboardSummary,
  PaginatedResponse,
  Transaction,
  AuditRecord,
  UploadResult,
  HealthStatus,
  RiskCategory,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

// ─── Health ───────────────────────────────────────────────────
export const fetchHealth = (): Promise<HealthStatus> =>
  api.get('/health').then(r => r.data);

// ─── Dashboard ────────────────────────────────────────────────
export const fetchDashboard = (): Promise<DashboardSummary> =>
  api.get('/api/v1/dashboard/summary').then(r => r.data);

// ─── Transactions ─────────────────────────────────────────────
export interface TransactionFilters {
  page?: number;
  page_size?: number;
  search?: string;
  risk?: RiskCategory;
  sort_by?: 'amount' | 'created_at' | 'risk_score';
  sort_dir?: 'asc' | 'desc';
}

export const fetchTransactions = (
  filters: TransactionFilters = {},
): Promise<PaginatedResponse<Transaction>> =>
  api.get('/api/v1/transactions', { params: filters }).then(r => r.data);

export const fetchTransaction = (id: string): Promise<Transaction> =>
  api.get(`/api/v1/transactions/${id}`).then(r => r.data);

export const uploadCSV = (file: File): Promise<UploadResult> => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/v1/transactions/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const analyzeTransactions = (): Promise<{ analyzed: number; message: string }> =>
  api.post('/api/v1/transactions/analyze').then(r => r.data);

// ─── Alerts ───────────────────────────────────────────────────
export interface AlertFilters {
  page?: number;
  page_size?: number;
  category?: RiskCategory;
}

export const fetchAlerts = (
  filters: AlertFilters = {},
): Promise<PaginatedResponse<Transaction>> =>
  api.get('/api/v1/alerts', { params: filters }).then(r => r.data);

// ─── Audit ────────────────────────────────────────────────────
export const fetchAuditRecords = (): Promise<AuditRecord[]> =>
  api.get('/api/v1/audit-records').then(r => r.data);

export const submitAuditRecord = (transaction_id: string): Promise<AuditRecord> =>
  api.post('/api/v1/audit-records', { transaction_id }).then(r => r.data);
