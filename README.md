# 🔐 Inclusive Digital Identity Platform

> **"Share Proof, Not Data."** — Addressing SDG 10 (Reduced Inequalities)

A full-stack, demo-ready prototype of a privacy-preserving digital identity verification platform.
Users verify their identity **once**, receive a **reusable verifiable credential**, and then prove
eligibility (e.g., `age > 18`) to any service — **without revealing actual personal data**.

---

## 🚀 Quick Start

> **Prerequisites:** Python 3.9+, Node.js 18+

### Terminal 1 — Backend

```bash
cd backend
pip install -r requirements.tx```

API will be live at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be live at: `http://localhost:5173`

---

## 🗺️ Demo Walkthrough

| Step | Action | What You See |
|------|--------|--------------|
| 1 | Open `http://localhost:5173` | Registration form with drag-and-drop photo upload |
| 2 | Fill name, age, ID number → upload a photo with your face | Loading spinner "Running AI Fraud Analysis..." |
| 3 | Wait 1–2 seconds | ✅ Identity Verified + color-coded AI Risk Score (🟢 LOW / 🟡 MEDIUM / 🔴 HIGH) |
| 4 | Click "Continue to Dashboard" | User profile + wallet action card |
| 5 | Click "Generate Verifiable Credential" | Dark-themed credential card with SHA-256 signature |
| 6 | Click "View Raw JSON ▼" | Syntax-highlighted JSON of the full credential |
| 7 | Click "Generate Zero-Knowledge Proof →" | ZKP Engine page |
| 8 | Type `age > 18` (or click a preset) → click "Generate Proof" | Proof card showing TRUE/FALSE — **no actual age shown** |
| 9 | Select a service (Banking / Healthcare / Government) | Service cards |
| 10 | Click "Verify with Selected Service" | 🎉 **ACCESS GRANTED** with confetti, or ❌ ACCESS DENIED |

---

## 🧱 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  RegisterPage → DashboardPage → CredentialPage          │
│                              → VerifyPage               │
│                                                         │
│  State: userId, userData, credential, currentStep       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (axios)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                      │
│                                                         │
│  POST /api/register          → identity_service.py      │
│  POST /api/generate-credential → credential_service.py  │
│  POST /api/generate-proof    → zkp_service.py           │
│  POST /api/verify-proof      → verification_service.py  │
│  GET  /api/credential/{id}   → credential_service.py    │
│  GET  /api/user/{id}         → verify.py route          │
└────────────────────────┬────────────────────────────────┘
                         │ SQLAlchemy ORM
                         ▼
                   SQLite Database
              (users, credentials, proofs)
```

---

## 🔒 How ZKP is Simulated

In a real Zero-Knowledge Proof system (e.g., zk-SNARKs), a cryptographic circuit evaluates
a condition on private data and produces a mathematical proof that the condition is true —
**without revealing the underlying value**.

In this prototype:

1. User sends condition (`"age > 18"`) and their `user_id`
2. Backend fetches actual age from DB (**private, server-side only**)
3. Evaluates condition internally using Python comparison operators
4. Returns only `TRUE/FALSE` + `proof_id` — actual age is **never** included in response
5. The `"data_revealed": false` field explicitly confirms zero disclosure

**What this simulates correctly:**
- ✅ Verifier learns only: `TRUE` or `FALSE`
- ✅ Verifier never sees: actual age value
- ✅ User never transmits: raw personal data
- ✅ Proof is reusable and auditable via `proof_id`

---

## 📁 Project Structure

```
IVP/
├── backend/
│   ├── main.py                    # FastAPI app + CORS + routes
│   ├── database.py                # SQLAlchemy engine + session
│   ├── models.py                  # ORM models: User, Credential, Proof
│   ├── requirements.txt
│   ├── services/
│   │   ├── identity_service.py    # Registration + image upload
│   │   ├── fraud_service.py       # OpenCV Haar Cascade face detection
│   │   ├── credential_service.py  # SHA-256 signed credential generation
│   │   ├── zkp_service.py         # Zero-knowledge proof simulation
│   │   └── verification_service.py # Proof lookup + access decision
│   └── routes/
│       ├── register.py            # POST /api/register
│       ├── credential.py          # POST /api/generate-credential, GET /api/credential/{id}
│       ├── proof.py               # POST /api/generate-proof
│       └── verify.py              # POST /api/verify-proof, GET /api/user/{id}
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Root — state, routing, step management
    │   ├── main.jsx
    │   ├── index.css              # Tailwind + custom animations
    │   ├── api/client.js          # Axios API client
    │   ├── components/
    │   │   ├── StepIndicator.jsx  # Persistent 5-step progress bar
    │   │   ├── Toast.jsx          # Slide-in toast notifications
    │   │   ├── FraudBadge.jsx     # Color-coded risk badge
    │   │   ├── CredentialCard.jsx # Dark themed visual credential
    │   │   └── LoadingSpinner.jsx # Full-screen overlay spinner
    │   └── pages/
    │       ├── RegisterPage.jsx   # Step 1+2: Register + fraud result
    │       ├── DashboardPage.jsx  # Step 3: Profile + credential issuance
    │       ├── CredentialPage.jsx # Step 3b: View credential
    │       └── VerifyPage.jsx     # Step 4+5: ZKP + Service verification
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🌐 API Reference

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| POST | `/api/register` | multipart: `name`, `age`, `id_number`, `image?` | Register identity + AI fraud check |
| POST | `/api/generate-credential` | `{ user_id }` | Issue verifiable credential |
| POST | `/api/generate-proof` | `{ user_id, condition }` | Generate ZK proof |
| POST | `/api/verify-proof` | `{ proof_id }` | Verify proof → ACCESS_GRANTED / ACCESS_DENIED |
| GET | `/api/credential/{user_id}` | — | Fetch latest credential |
| GET | `/api/user/{user_id}` | — | Fetch user profile (masked) |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#3B82F6` | Buttons, links, active states |
| Success | `#10B981` | Verified, access granted |
| Warning | `#F59E0B` | Medium risk |
| Danger | `#EF4444` | High risk, access denied |
| Background | `#F8FAFC` | Page background |
| Font | Inter (Google Fonts) | All text |

---

## 🤝 SDG Alignment

This platform directly addresses **SDG 10 — Reduced Inequalities** by:

- Eliminating **repeated KYC processes** that exclude rural and migrant workers
- Enabling **one-time identity verification** that is reusable across services
- Ensuring **data minimization** — services learn only what they need (TRUE/FALSE)
- Providing a foundation for **inclusive access** to banking, healthcare, and government benefits
