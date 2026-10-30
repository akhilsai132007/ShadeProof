# ShadeProof — AI Foundation Shade Matcher & Virtual Try-On
> **YouCam API Skin AI & eCommerce VTO Hackathon 2026**  
> *"Find your closest foundation match. See it before you buy it."*

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13](https://img.shields.io/badge/Python-3.13-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Pytest-50%20Passed-brightgreen.svg)](backend/tests/)

---

## 1. Executive Summary & Problem Statement

Selecting the right foundation shade online remains one of the largest friction points in cosmetics eCommerce:
* **The Problem:** Color swatches displayed on digital screens rarely match real human skin under ambient lighting, leading to return rates exceeding **30%** in online beauty retail.
* **The Solution:** **ShadeProof** integrates Perfect Corp's official YouCam Skin-Tone Analysis AI with an objective **CIEDE2000 ($\Delta E_{00}$)** spectrophotometric matching engine, photorealistic **YouCam Makeup Virtual Try-On (VTO)**, and actionable **Merchant Assortment Analytics**.
* **Zero Guesswork, Zero Exaggeration:** ShadeProof does not fabricate clinical claims or present heuristic similarity as statistical probabilities. It provides transparent mathematical color distance, dermatological Individual Typology Angle ($\text{ITA}^\circ$) phototyping, and authentic YouCam VTO renders.

---

## 2. Core Feature Architecture

### A. Consumer Shade Finder
1. **Intake & Consent:** Privacy-first selfie upload, local webcam capture, or 1-click verified demographic demo portraits with lighting/angle guidance.
2. **YouCam Skin-Tone Analysis AI:** Calls YouCam S2S v2.0 (`POST /s2s/v2.0/file` and `POST /s2s/v2.0/task/skin-tone`) to extract calibrated CIE $L^*, a^*, b^*$, dermatological $\text{ITA}^\circ$, and Fitzpatrick phototype.
3. **Consumer Brand & Finish Controls:** Pre-matching filters dynamically introspected from the live catalogue (e.g., *Aura Botanica* or *Velvet Radiance*; *Natural Satin*, *Soft Matte*, or *Radiant Dewy*).
4. **CIEDE2000 Matching Engine:** Ranks shades by perceptual color difference ($\Delta E_{00}$) using Sharma et al. (2005) reference formulation combined with undertone compatibility penalties.
5. **Photorealistic Makeup VTO:** Renders the selected candidate via YouCam S2S v2.0 (`POST /s2s/v2.0/task/makeup`).
6. **Undistorted Before/After Comparison:** Smooth split slider using CSS `clip-path` that preserves 1:1 portrait aspect ratio without horizontal stretching. Pure YouCam render with **zero deceptive CSS multiply tints**.
7. **Visual Swatch Comparison Modal:** Allows side-by-side inspection of analyzed skin sample vs. foundation swatch, with explicit educational disclosures regarding formula finish, coverage sheerness, and oxidization.

### B. Merchant Assortment Analytics
1. **20-Cell Assortment Matrix:** Maps catalogue SKUs across a $5 \times 4$ grid (Fair, Light, Medium, Tan, Deep $\times$ Warm, Neutral, Cool, Olive).
2. **Coverage Gap Detection:** Automatically pinpoints single-point-of-failure vulnerabilities and critical out-of-stock shade segments.
3. **Assortment Restock Simulator:** Interactive planning sandbox allowing merchandisers to project stock rebalancing and visualize coverage improvements.
4. **Structured CSV Export:** One-click export formatted for supply-chain and merchandising teams.

### C. Judge Transparency & Execution Diagnostics
* **Persistent Diagnostics Status Pill:** Visible in the top navbar on desktop and mobile (`Live YouCam API` vs. `Sandbox Demo Mode`).
* **Interactive Diagnostics Drawer:** Explains current execution mode, verifies server-side credential status, and provides an active gateway connectivity probe to `https://yce-api-01.makeupar.com`.
* **Zero Credential Exposure:** YouCam API keys remain strictly server-side in `backend/.env`. No keys are ever transmitted to the frontend bundle, `localStorage`, or public endpoints.

---

## 3. Live vs. Sandbox Execution Matrix

| Capability | Live YouCam Mode (`YOUCAM_API_KEY` set) | Sandbox Demo Mode (Default / Unconfigured) |
| :--- | :--- | :--- |
| **Status Pill** | Green `Live YouCam` badge with pulsing indicator | Amber `Sandbox Demo` badge with test-tube icon |
| **Selfie Asset Staging** | Uploaded to YouCam S3 storage via `POST /s2s/v2.0/file` | Staged with local image blob |
| **Skin Tone Analysis** | Processed via YouCam cloud (`POST /s2s/v2.0/task/skin-tone`) | Calibrated YouCam S2S response fixtures |
| **Shade Matching Engine** | **Live & Real:** Runs CIEDE2000 against SQLite catalogue | **Live & Real:** Runs CIEDE2000 against SQLite catalogue |
| **Brand & Finish Filters** | **Live & Real:** Introspects active database catalogue | **Live & Real:** Introspects active database catalogue |
| **Virtual Try-On Render** | Rendered via YouCam cloud (`POST /s2s/v2.0/task/makeup`) | Rendered using verified YouCam S2S portrait fixtures |
| **Comparison Slider** | **Live & Real:** CSS clip-path comparison slider | **Live & Real:** CSS clip-path comparison slider |
| **Merchant Analytics** | **Live & Real:** Aggregates live SQLite database catalogue | **Live & Real:** Aggregates live SQLite database catalogue |

---

## 4. Tech Stack

* **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2, `httpx` (async HTTP client).
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v3, Lucide Icons.
* **Testing:** Pytest, `pytest-asyncio`, FastAPI `TestClient` (**50 automated tests passing**).
* **Colorimetry Standards:** CIE D65 reference illuminant, Sharma et al. (2005) CIEDE2000 formulation, Individual Typology Angle ($\text{ITA}^\circ$).

---

## 5. Directory Structure

```text
ShadeProof/
├── README.md                          # Comprehensive project documentation
├── LICENSE                            # MIT Open Source License
├── DEMO_SCRIPT.md                     # 2m 30s timestamped presentation script
├── .gitignore                         # Python, Node, database & secret exclusions
├── backend/
│   ├── .env                           # Local server-side environment variables
│   ├── .env.example                   # Template environment configuration
│   ├── requirements.txt               # Backend dependencies
│   ├── app/
│   │   ├── main.py                    # FastAPI application, CORS & lifespan
│   │   ├── config.py                  # Pydantic BaseSettings & env loading
│   │   ├── database.py                # SQLAlchemy 2 engine & sessionmaker
│   │   ├── models/shade.py            # FoundationShade database model
│   │   ├── schemas/
│   │   │   ├── shade.py               # Foundation shade schemas
│   │   │   └── diagnostics.py         # System diagnostics schemas
│   │   ├── services/
│   │   │   ├── matching_engine.py     # CIELAB & CIEDE2000 matching engine
│   │   │   ├── merchant_analytics.py  # 20-cell assortment matrix & gap detector
│   │   │   ├── youcam_client.py       # Async YouCam S2S client with connectivity probe
│   │   │   ├── youcam_schemas.py      # Normalized YouCam API data contracts
│   │   │   └── youcam_service.py      # High-level orchestration & sandbox fallback
│   │   ├── api/v1/router.py           # REST endpoints: /analyze-skin, /diagnostics, etc.
│   │   └── seed/seed_data.py          # 24 calibrated demo shades across 2 brands
│   └── tests/                         # 50 Automated tests
│       ├── conftest.py                # Database & TestClient fixtures
│       ├── test_health_and_db.py      # Health, database & seed verification
│       ├── test_matching_engine.py    # Sharma benchmark, brand/finish filter tests
│       ├── test_merchant_analytics.py # Assortment matrix, gap & CSV export tests
│       └── test_youcam.py             # S2S presign, polling, diagnostics & security tests
└── frontend/
    ├── .env                           # Frontend environment configuration
    ├── package.json                   # React 19 & Vite scripts
    ├── vite.config.ts                 # Vite bundler configuration
    ├── tailwind.config.js             # Luxury editorial design tokens
    └── src/
        ├── App.tsx                    # Root container, diagnostics poller & tabs
        ├── services/api.ts            # Typed API client (zero keys exposed)
        └── components/
            ├── Navbar.tsx             # Sticky header with persistent diagnostics pill
            ├── Footer.tsx             # Privacy, color science & hackathon disclosures
            ├── AboutView.tsx          # Architectural & scientific explainer
            ├── DiagnosticsModal.tsx   # Diagnostics drawer with live connectivity probe
            ├── ShadeFinder/           # Consumer Shade Finder workflow
            │   ├── ShadeFinderView.tsx      # Step controller
            │   ├── IntakeStep.tsx           # Upload, webcam, consent & demo portraits
            │   ├── AnalysisResultsStep.tsx  # Skin diagnostic swatches & pre-filters
            │   ├── MatchesStep.tsx          # Top 3 ranked cards with filter bar
            │   └── TryOnStep.tsx            # Undistorted split slider & swatch modal
            └── Merchant/              # Merchant Analytics Suite
                └── MerchantDashboardView.tsx # 20-cell matrix, gaps & restock simulator
```

---

## 6. Getting Started & Local Setup

### Prerequisites
* **Python 3.10+** (Python 3.13 recommended)
* **Node.js v18+**
* **npm v9+**

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   Verify `backend/.env` exists (copy from `.env.example` if needed):
   ```env
   APP_NAME=ShadeProof API
   ENV=development
   DEBUG=True
   PORT=8000
   HOST=127.0.0.1
   CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
   DATABASE_URL=sqlite:///./shadeproof.db
   YOUCAM_API_KEY=
   YOUCAM_BASE_URL=https://yce-api-01.makeupar.com
   ```
   *(Note: Leave `YOUCAM_API_KEY` empty to test in zero-dependency Sandbox Evaluation Mode).*

4. **Launch the FastAPI backend:**
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * Interactive OpenAPI Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   * Diagnostics Endpoint: [http://127.0.0.1:8000/api/v1/diagnostics](http://127.0.0.1:8000/api/v1/diagnostics)
   * Health Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify environment:**
   Ensure `frontend/.env` contains:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

4. **Launch the Vite development server:**
   ```bash
   npm run dev
   ```
   * Access the application at: [http://localhost:5173](http://localhost:5173)

---

## 7. Automated Testing Suite

Execute the full backend test suite:

```bash
cd backend
python -m pytest -v
```

### Test Suite Summary (50 Passing Tests):
* **`test_health_and_db.py` (7 tests):** `/health` endpoint, database initialization, 24 seed shades across 2 brands, filtering by depth/undertone, and boundary conversions.
* **`test_matching_engine.py` (16 tests):** sRGB $\to$ CIELAB conversion, **Sharma et al. (2005) reference benchmark pairs**, undertone penalty weighting, ranking determinism, empty catalogue handling, brand filtering, finish filtering, combined filtering, and empty filter states.
* **`test_merchant_analytics.py` (7 tests):** KPI aggregations, 20-cell ($5 \times 4$) matrix dimensions, critical gap identification, brand/finish filtering, and structured CSV export generation.
* **`test_youcam.py` (20 tests):** S3 presigned PUT workflow, polling loops, 401/429 error handling, $\text{ITA}^\circ$ and Fitzpatrick classification, defensive normalization, sandbox fixtures, and **5 dedicated diagnostics tests** verifying that raw API keys are never exposed in responses.

---

## 8. Responsible AI & Data Transparency Commitments

* **No Probabilistic Deception:** Compatibility scores are clearly documented as perceptual color distance ($\Delta E_{00}$), not machine-learning certainty.
* **Objective Dermatological Grounding:** Skin tones are quantified via CIELAB and Individual Typology Angle ($\text{ITA}^\circ$), avoiding subjective or demographic assumptions.
* **Assortment Analytics, Not Customer Profiling:** The merchant dashboard audits **catalogue inventory variety**, not demographic customer trends or sensitive personal data.
* **Consent-First Architecture:** Selfies are processed in memory and are never persisted or shared without explicit user authorization.

---

## 9. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
