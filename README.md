# RecoverAI — Intelligent Payment Recovery

## 📌 Project Overview
RecoverAI is an intelligent payment recovery system designed for the Razorpay Buildathon. It combines the power of AI diagnosis with a deterministic policy engine to automatically handle and recover from payment failures. By identifying the root cause of a failed payment, RecoverAI determines the best recovery strategy—whether it's sending a Razorpay Payment Link, alerting customer support, or retrying—all while strictly adhering to bounded business policies.

## 🔴 Problem Statement
Payment failures result in significant revenue loss and poor user experience. Traditional recovery methods are often manual, static, and reactive. Businesses lack automated, intelligent workflows that can parse payment failure context (e.g., insufficient funds vs. technical gateway errors) and dynamically apply the correct recovery strategy without violating risk thresholds.

## 🟢 Solution
RecoverAI solves this by introducing a dual-layer architecture:
1. **AI Diagnosis Layer:** Analyzes the failure context (using Google Gemini) to recommend the optimal recovery strategy.
2. **Policy Validation Layer:** A deterministic engine that intercepts the AI's recommendation and ensures it complies with business rules (e.g., risk scores, maximum allowed discounts, retry limits). 

This ensures that AI-driven actions are always bounded, safe, and verifiable.

## ✨ Key Features
- **AI-Powered Diagnostics:** Uses LLMs to analyze failure reasons and suggest recovery actions.
- **Bounded AI via Policy Engine:** Prevents the AI from taking high-risk or unauthorized actions.
- **Razorpay Integration:** Creates real Razorpay Test Mode Payment Links for automated recovery.
- **Audit Logging & Explainability:** Every AI decision and policy validation is logged for full transparency.
- **Real-time Dashboard:** Monitor Revenue at Risk, Revenue Recovered, and Recovery Rates.

---

## 🔄 End-to-End Workflow

1. **Failed Payment:** A payment failure is simulated or received via webhook.
2. **AI Diagnosis:** The AI model analyzes the transaction and suggests a recovery action (e.g., `PAYMENT_LINK`, `SUPPORT_TICKET`, `RETRY`).
3. **Policy Validation:** The Policy Engine checks the AI's suggestion against business rules.
4. **Recovery Action:** If approved, the system executes the action.
5. **Razorpay:** A real Razorpay Payment Link (Test Mode) is generated and sent.
6. **Audit Logs:** The entire decision tree (AI input, output, policy outcome) is recorded.
7. **Metrics:** The Dashboard updates in real-time to reflect the new state.

---

## 🧠 AI Architecture & Policy Engine

### AI Diagnosis (Google Gemini)
The system leverages Google Gemini to process transaction metadata, error codes, and customer history. It outputs a structured diagnosis and a recommended action. **Deterministic Fallback:** If the AI is unavailable, times out, or returns malformed data, a rule-based deterministic fallback safely handles the transaction.

### Policy Engine (Bounded AI)
AI models can hallucinate or suggest actions outside of business comfort zones. The Policy Engine acts as a strict firewall. It evaluates the AI's suggested action against predefined policies (e.g., checking if the customer's risk score is too high to offer a discount). If the AI action fails validation, the system falls back to a safe default action (like creating a support ticket).

---

## 💳 Razorpay Integration
RecoverAI integrates directly with Razorpay:
- **Payment Links:** Successfully verified creation of real Razorpay Test Mode Payment Links via the Razorpay Python SDK.
- **Webhook Handling:** Ready for signature verification and idempotency processing to handle asynchronous payment updates securely. 
*(Note: Real webhook delivery from Razorpay to local environments was simulated via internal mocking for the demo, but the handler logic is implemented).*

---

## 🛠️ Technology Stack
- **Frontend:** Next.js, React, TailwindCSS, Recharts
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (using SQLAlchemy & Pydantic for ORM/Validation)
- **AI / LLM:** Google Gemini API
- **Payments:** Razorpay API

---

## 🏗️ Architecture

```mermaid
graph TD
    A[Payment Failure] -->|Webhook/Simulation| B(FastAPI Backend)
    B --> C{AI Diagnosis Engine}
    C -->|Recommended Action| D{Policy Validation Engine}
    D -->|Approved| E[Execute Action]
    D -->|Rejected| F[Fallback Action]
    E --> G[Razorpay API: Create Payment Link]
    F --> H[Internal: Create Support Ticket]
    E --> I[(PostgreSQL: Audit Logs & Metrics)]
    F --> I
    I --> J[Next.js Dashboard UI]
```

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL installed and running
- Razorpay Account (Test Mode)
- Google Gemini API Key

### 2. Environment Variables
Create a `.env` file in the `backend/` directory and `.env.local` in the root (Next.js) directory. **Do not commit secrets.**

**`backend/.env` (Example):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/recoverai
RAZORPAY_KEY_ID=rzp_test_placeholder_id
RAZORPAY_KEY_SECRET=placeholder_secret_string
GEMINI_API_KEY=placeholder_gemini_key
```

**`.env.local` (Frontend - Example):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. How to Run

**Database Setup:**
Ensure your local PostgreSQL server is running and the database specified in `DATABASE_URL` is created.

**Backend (FastAPI):**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed_demo_data.py # Optional: Seed database for demo
uvicorn app.main:app --reload --port 8000
```

**Frontend (Next.js):**
```bash
# In the root directory
npm install
npm run dev
# The app will be available at http://localhost:3000
```

---

## 📡 API Overview
- `POST /api/simulation/failed-payment` - Simulates a new failed transaction and triggers the recovery pipeline.
- `GET /api/metrics` - Retrieves dashboard statistics (Revenue at Risk, Recovery Rate, etc.).
- `GET /api/audit-logs` - Retrieves the explainability logs for AI and Policy decisions.
- `GET /api/policies` - Retrieves active business policies.

---

## 🔒 Security Considerations
- **Bounded Execution:** AI cannot execute actions directly; all actions are strictly validated.
- **Webhook Security:** Built-in HMAC signature validation for Razorpay webhooks.
- **Idempotency:** Webhook and simulation handlers are designed to be idempotent to prevent duplicate actions.

---

## ⚠️ Current Limitations
- AI Diagnosis relies on the Gemini API; latency may vary.
- Real-world webhook receiving requires a public tunnel (e.g., ngrok) which was mocked for local demo purposes.

---

## 🎬 Buildathon Demo Flow
1. **Dashboard:** View overall recovery metrics.
2. **Simulation:** Generate a synthetic failed payment.
3. **AI Diagnosis:** View the raw AI decision and rationale.
4. **Policy Engine:** Watch the Policy Engine approve or reject the AI's action.
5. **Execution:** See the Razorpay Payment Link generated.
6. **Audit Logs:** Review the full lifecycle of the transaction for explainability.
