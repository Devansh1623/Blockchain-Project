# ChainSleuth — Architecture & System Design

## 1. System Overview

ChainSleuth is an AI-powered blockchain fraud detection platform demonstrating the union of machine learning anomaly detection with immutable on-chain audit trails.

```mermaid
flowchart TD
    subgraph Data Layer
        CSV[Sample CSV Dataset / Sepolia Transfers]
        DB[(SQLite / aiosqlite)]
    end

    subgraph Backend Service [FastAPI Backend]
        Ingest[CSV Ingestion & Normalizer]
        FE[Feature Extraction Engine]
        ML[Isolation Forest Model]
        Rules[Explainability Rationale Engine]
        API[FastAPI Endpoints]
        Web3Service[Audit Bridge Service]
    end

    subgraph Client [React + TypeScript Frontend]
        Dash[Dashboard & KPI Metrics]
        TxPage[Transaction Explorer]
        TxDetail[Explainability & Risk Gauge]
        Ledger[Blockchain Audit History]
    end

    subgraph Smart Contract [Sepolia Ethereum]
        AuditContract[ChainSleuthAudit.sol]
    end

    CSV -->|Upload / Load| Ingest
    Ingest --> DB
    API -->|Fetch Transactions| DB
    API -->|Trigger Inference| FE
    FE --> ML
    ML -->|Risk Score [0-100]| Rules
    Rules -->|Explanations| DB
    Dash --> API
    TxPage --> API
    TxDetail --> API
    Ledger --> API
    TxDetail -->|Commit Finding| Web3Service
    Web3Service -->|recordFinding| AuditContract
```

## 2. Component Specifications

### 2.1 Backend (Python FastAPI)
- **Framework:** FastAPI with asynchronous request routing (`asyncio`).
- **ORM:** SQLAlchemy 2.0 async with `aiosqlite`.
- **Validation:** Pydantic v2 schemas for all inputs, outputs, and responses.
- **ML Engine:** Scikit-learn `IsolationForest` pipeline loaded once during lifespan startup.

### 2.2 Feature Engineering
Features extracted per transaction:
- `amount`: Raw ETH transferred.
- `log_amount`: Log-scaled amount $\ln(1 + \text{amount})$.
- `amount_z_score`: Standardized score relative to dataset mean/std.
- `tx_frequency`: Wallet transaction count within temporal window.
- `unique_counterparties`: Count of distinct destination addresses.
- `amount_rank_percentile`: Percentile rank across distribution.

### 2.3 Explainability
Transparent, rule-based algorithmic explainability directly mapped to computed statistical features:
- Outlier amounts ($z > 2.5$) flagged with precise deviation multiples.
- Rapid burst transactions ($>20$/window) flagged with frequency details.
- High counterparty dispersion ($>15$ distinct addresses) identified.
- No hallucinated LLM rationale; all factors are grounded in verifiable data.

### 2.4 Blockchain Smart Contract
- **Contract:** `ChainSleuthAudit.sol` on Sepolia testnet.
- **Standard:** OpenZeppelin `AccessControl`.
- **Tamper Evidence:** Only authorized `REPORTER_ROLE` can commit findings. Findings cannot be modified or overwritten once recorded.
