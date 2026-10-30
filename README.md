# ChainSleuth — AI-Powered Blockchain Fraud Detection

> **B.Tech CSE-AI Portfolio Project** · Research & Educational Prototype

ChainSleuth is a lightweight, full-stack application that analyzes blockchain transfer data, detects statistical transaction anomalies using an **Isolation Forest** machine learning pipeline, provides deterministic feature-derived explainability, and commits selected fraud findings to an immutable smart contract on the Ethereum Sepolia testnet.

---

## Architecture

```
React 18 + TypeScript + Tailwind (Vite)
                     │
          FastAPI + SQLite (Async)
          /          │          \
  Pandas ETL   Isolation Forest  Web3 Audit Service
  (Features)     (scikit-learn)          │
                                 ChainSleuthAudit.sol
                                  (Sepolia Testnet)
```

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Sonner |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 Async, aiosqlite |
| **Machine Learning** | scikit-learn (Isolation Forest), Pandas, NumPy, Joblib |
| **Database** | SQLite with asynchronous session management |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin 5 AccessControl, Hardhat, Ethers.js |

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Train or re-train Isolation Forest model
python -m app.ml.train

# Run backend tests
python -m pytest tests/ -v

# Start FastAPI server (runs on http://localhost:8000)
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Build for production
npm run build

# Start dev server (runs on http://localhost:5173)
npm run dev
```

### 3. Smart Contracts (Optional)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

---

## Key Features

1. **AI Anomaly Detection:** Real-time scoring (0–100) using unsupervised Isolation Forest trained on transaction volume z-score, velocity frequency, counterparty diversity, and log amount distribution.
2. **Transparent Explainability:** Deterministic, rule-based rationale breakdowns explaining why each transaction was flagged—no black-box hallucinations.
3. **Cryptographic Proof of Finding:** Directly commit high-risk alerts to `ChainSleuthAudit.sol` with reporter access control and verifiable tx hashes on Sepolia Etherscan.
4. **Dark Minimalist Aesthetic:** Clean, high-density interface inspired by Linear and Vercel with responsive tables, SVG risk badges, and interactive Recharts donut distributions.

---

## Documentation

- [Architecture & Flow Specification](docs/architecture.md)
- [Model Limitations & Disclaimers](docs/model-limitations.md)

---

## License

MIT — Created for educational and academic portfolio demonstration.
