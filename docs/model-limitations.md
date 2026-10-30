# Machine Learning Model Limitations & Disclaimers

## Academic & Research Context
ChainSleuth utilizes an unsupervised anomaly detection model (**Isolation Forest**) to flag suspicious patterns in blockchain transfers. This system is designed as an educational and portfolio demonstration. It does not replace certified compliance, anti-money-laundering (AML), or forensic blockchain analysis tools.

---

## 1. Algorithmic Assumptions

### 1.1 Unsupervised Anomaly Detection
- The Isolation Forest algorithm assumes anomalies are **"few and different"**.
- Legitimate high-value transactions (such as institutional rebalancing, exchange hot-wallet transfers, or token liquidations) can be classified as anomalies because they statistically deviate from typical transfer sizes.
- Low-value distributed fraud (such as dusting attacks or low-value sybil swarms) may fall within normal statistical ranges unless specialized graph-clustering metrics are included.

### 1.2 Feature Independence & Context
- The model operates primarily on tabular transfer data (amounts, frequency, counterparty counts).
- It does **not** perform full bytecode decompilation or smart contract internal transaction tracing (e.g. flash loan detection or reentrancy execution analysis).
- Graph topology is localized to direct counterparty counts rather than multi-hop taint analysis.

---

## 2. Thresholds & False Positives

| Risk Category | Score Range | Expected Interpretation |
|---|---|---|
| **LOW** | 0 – 29 | Standard transaction profile within normal statistical distribution. |
| **MEDIUM** | 30 – 59 | Minor deviation in frequency or amount; warrants routine monitoring. |
| **HIGH** | 60 – 79 | Substantial deviation in volume, velocity, or network counterparty spread. |
| **CRITICAL** | 80 – 100 | Extreme statistical outlier ($>3\sigma$ amount or abnormal rapid bursting). |

**False Positive Mitigation:**
All risk outputs include granular feature explanations and a mandatory disclaimer:
> *"Risk score indicates statistical deviation from baseline patterns; it is not definitive proof of illicit activity."*

---

## 3. Recommended Production Extensions
For enterprise production AML deployments:
1. Integrate graph neural networks (GNNs) such as RGCN or GraphSAGE on the full transaction graph.
2. Cross-reference known sanctioned addresses (OFAC lists, known exploiters).
3. Implement continuous streaming inference via Kafka and Flink with real-time mempool monitoring.
