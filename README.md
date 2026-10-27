# ShadeProof — AI Foundation Shade Matcher & Virtual Try-On
> **YouCam API Skin AI & eCommerce VTO Hackathon 2026**  
> *"Find your closest foundation match. See it before you buy it."*

---

## 1. Project Overview

**ShadeProof** is an end-to-end foundation shade-matching and eCommerce virtual try-on application designed to resolve the primary uncertainty in online cosmetics shopping: **selecting the right foundation shade online without physical swatching.**

ShadeProof bridges:
1. **Selfie Capture & Intake:** Consent-first portrait intake with lighting and pose guidance, local webcam capture, or one-click demo test portraits.
2. **YouCam Skin-Tone Analysis AI:** Calls Perfect Corp's verified `POST /s2s/v2.0/task/skin-tone-analysis` endpoint to extract calibrated CIE $L^*, a^*, b^*$, undertone, and skin tone level.
3. **Standalone CIEDE2000 Matching Engine:** Compares the user's analyzed skin tone against an active foundation catalogue using objective **CIEDE2000 ($\Delta E_{00}$)** perceptual color difference (Sharma et al., 2005) and an explicit undertone compatibility matrix.
4. **Transparent Ranking:** Displays the top three candidate shades with visible $\Delta E_{00}$ values and an explainable heuristic compatibility index (no fabricated ML probability claims).
5. **YouCam Makeup Virtual Try-On (VTO):** Invokes `POST /s2s/v2.0/task/makeup-vto` (with `category: "foundation"`) to render the selected candidate shade onto the user's face with adjustable coverage, color, and glow intensity sliders.
6. **Merchant Assortment Analytics Dashboard:** An eCommerce analytics suite auditing catalogue variety across a 20-cell Depth $\times$ Undertone matrix, identifying critical assortment gaps, and providing one-click CSV export for assortment planning.

---

## 2. Architecture & YouCam API Integration Layer

```text
                                  +---------------------------------------+
                                  |   Perfect Corp YouCam S2S Cloud API   |
                                  |   - POST /s2s/v2.0/file (S3 Presign)  |
                                  |   - POST /s2s/v2.0/task/skin-tone     |
                                  |   - POST /s2s/v2.0/task/makeup-vto    |
                                  +-------------------+-------------------+
                                                      ^
                                                      | Async S2S HTTPS
                                                      v
+-------------------------------+       +-------------+-------------------+
|  ShadeProof Frontend          |       |  ShadeProof Backend Gateway     |
|  - React 19 + TypeScript      |<=====>|  - Python 3.13 + FastAPI        |
|  - Tailwind CSS + Vite        | HTTP  |  - SQLAlchemy 2 + SQLite        |
|  - Luxury Editorial UI        |       |  - Sharma CIEDE2000 Math        |
+-------------------------------+       +---------------------------------+
```

### Verified YouCam API Workflows
* **Presigned File Upload:** `POST /s2s/v2.0/file` returns a direct AWS S3 presigned PUT URL and `file_id`. The image binary is streamed directly to S3.
* **Skin Tone Task:** Dispatched via `POST /s2s/v2.0/task/skin-tone-analysis`. The backend polls `GET /s2s/v2.0/task/skin-tone-analysis/{task_id}` until completion, normalizing CIE $L^*, a^*, b^*$, undertone (`Warm`, `Cool`, `Neutral`, `Olive`), and tone level (`Fair`, `Light`, `Medium`, `Tan`, `Deep`).
* **Foundation Makeup VTO:** Dispatched via `POST /s2s/v2.0/task/makeup-vto` with `category: "foundation"` passing candidate shade hex codes (`#RRGGBB`), `colorIntensity`, `coverageIntensity`, and `glowIntensity`.
* **Zero Broken Demos (Offline Sandbox Fallback):** If `YOUCAM_API_KEY` is configured in `backend/.env`, requests route directly to live YouCam servers. If unconfigured or quota-exhausted, the service operates in a clearly-labeled **Evaluation Sandbox Mode** using verified fixtures, ensuring that hackathon reviewers can test the full user journey without interruption.

---

## 3. Tech Stack

* **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2, `httpx` (async HTTP).
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v3, Lucide Icons.
* **Testing:** Pytest, `pytest-asyncio`, FastAPI `TestClient` (38 automated tests).
* **Colorimetry Standards:** CIE D65 reference white, Sharma et al. (2005) CIEDE2000 formulation, Individual Typology Angle ($ITA^\circ$).

---

## 4. Directory Structure

```text
ShadeProof/
├── README.md                      # Complete system documentation & demo guide
├── .gitignore                     # Git ignore rules for Python & Node
├── backend/
│   ├── .env                       # Local environment variables
│   ├── .env.example               # Template environment configuration
│   ├── requirements.txt           # Python backend dependencies
│   ├── app/
│   │   ├── main.py                # FastAPI app, lifespan, CORS, /health
│   │   ├── config.py              # Pydantic BaseSettings
│   │   ├── database.py            # SQLAlchemy 2 engine & sessionmaker
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   └── shade.py           # FoundationShade database model
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   └── shade.py           # FoundationShadeResponse schema
│   │   ├── services/              # Core business & algorithmic logic
│   │   │   ├── matching_engine.py # CIELAB conversion & CIEDE2000 color matcher
│   │   │   ├── merchant_analytics.py # 2D assortment matrix & gap detector
│   │   │   ├── youcam_client.py   # Low-level S2S client with S3 presign & polling
│   │   │   ├── youcam_schemas.py  # Normalized data contracts
│   │   │   └── youcam_service.py  # High-level orchestration & sandbox fallback
│   │   ├── api/v1/                # API version 1 routers
│   │   │   └── router.py          # /analyze-skin, /match-shades, /virtual-try-on, etc.
│   │   └── seed/                  # Seed dataset
│   │       └── seed_data.py       # 16 calibrated demo foundation shades
│   └── tests/                     # 38 Automated tests
│       ├── conftest.py            # Database & TestClient fixtures
│       ├── test_health_and_db.py  # Health, seeding & filter tests
│       ├── test_matching_engine.py# Sharma benchmark & matching tests
│       ├── test_merchant_analytics.py # Matrix dimensions, gap detection & CSV tests
│       └── test_youcam.py         # S2S presign, polling & sandbox fallback tests
└── frontend/
    ├── .env                       # Frontend environment configuration
    ├── package.json               # Node dependencies & build scripts
    ├── vite.config.ts             # Vite configuration
    ├── tailwind.config.js         # Editorial palette (ivory, charcoal, gold)
    ├── index.html                 # Main entry HTML
    └── src/
        ├── main.tsx               # React root mount
        ├── App.tsx                # App shell, tab router, backend health poller
        ├── services/
        │   └── api.ts             # Frontend API client & TypeScript interfaces
        └── components/
            ├── Navbar.tsx         # Navigation header & live health indicator
            ├── Footer.tsx         # Data privacy & hackathon disclosures
            ├── AboutView.tsx      # Scientific & architectural explainer
            ├── ShadeFinder/       # 4-Step Consumer Shade Finder flow
            │   ├── ShadeFinderView.tsx      # Main controller with progress tabs
            │   ├── IntakeStep.tsx           # Upload, webcam, consent & demo portraits
            │   ├── AnalysisResultsStep.tsx  # Skin tone diagnostic swatches & ITA
            │   ├── MatchesStep.tsx          # Top 3 ranking cards with visible Delta E
            │   └── TryOnStep.tsx            # Side-by-side VTO viewer with intensity sliders
            └── Merchant/          # Merchant Analytics Suite
                └── MerchantDashboardView.tsx # 2D Matrix, KPI cards, gaps & CSV export
```

---

## 5. Getting Started & Local Setup

### Prerequisites
* **Python 3.10+** (Python 3.13 recommended)
* **Node.js v18+** (v24.16 installed)
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
   Verify `backend/.env` exists:
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
   *(Note: Leave `YOUCAM_API_KEY` blank to evaluate in zero-dependency Sandbox Evaluation Mode).*

4. **Start the backend development server:**
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * Interactive OpenAPI Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
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

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Running Automated Tests

Run the complete Pytest verification suite:

```bash
cd backend
python -m pytest -v
```

### Test Suite Breakdown (38 Tests Total):
* `test_health_and_db.py` (7 tests): `/health` endpoint, database initialization, 16 seed shades, filtering by depth/undertone, and boundary color conversions.
* `test_matching_engine.py` (10 tests): sRGB $\to$ CIELAB conversion, **Sharma et al. (2005) reference benchmark pairs**, undertone penalty matrix, ranking determinism, empty catalogue safety, and out-of-stock handling.
* `test_merchant_analytics.py` (7 tests): KPI aggregations, 20-cell ($5 \times 4$) matrix dimensions, critical gap identification, brand/product filtering, and structured CSV export generation.
* `test_youcam.py` (14 tests): Low-level S3 presigned PUT client, polling loops, 401/429 error handling, dermatological $ITA^\circ$ derivation, defensive normalization, and API endpoints (`/analyze-skin`, `/virtual-try-on`).

---

## 7. Hackathon Demonstration Script (2–3 Minutes)

When demonstrating ShadeProof to judges:

1. **The Problem (0:00 – 0:30):**
   * Online foundation return rates often exceed 30% due to lighting variability and inaccurate color matching.
   * Retailers have major assortment gaps (e.g., deep or olive undertones) without realizing it.
2. **Consumer Shade Finder (0:30 – 1:30):**
   * Navigate to the **Shade Finder** tab.
   * Click one of the 1-click demo test portraits (e.g., *Amara - Deep Warm* or *Sofia - Medium Olive*) or upload a custom selfie.
   * Highlight the **Consent & Privacy Notice**.
   * Click **"Analyze My Skin Tone"**. Review the extracted CIE $L^*, a^*, b^*$ values, tone level, undertone, and dermatological $ITA^\circ$ angle.
   * View the **Top 3 Matched Shades** ranked by **CIEDE2000 ($\Delta E_{00}$)** with transparent compatibility explanations.
   * Click **"Try On This Shade"** to launch the **Virtual Try-On Viewer**. Adjust coverage, color intensity, and glow to preview how the foundation blends onto the skin.
3. **Merchant Assortment Insights (1:30 – 2:30):**
   * Switch to the **Merchant Insights** tab.
   * Point out the **Coverage Index** (percentage of the 20 Depth $\times$ Undertone segments covered).
   * Hover and click on cells in the **2D Assortment Heatmap Matrix** to inspect SKUs in stock.
   * Point out the **Actionable Assortment Gaps** (e.g., Fair-Olive or Deep-Warm single points of failure).
   * Click **"Export CSV Report"** to download the merchant assortment planning sheet.
4. **Scientific & Architectural Rigor (2:30 – 3:00):**
   * Switch to the **About & Science** tab to explain the CIEDE2000 mathematical formula and transparency commitment.
   * Show the 38 passing automated tests in the terminal.

---

## 8. Responsible AI & Data Transparency Commitments

* **No Probabilistic Deception:** Heuristic compatibility scores are clearly documented as perceptual indices ($\Delta E_{00}$), not statistical certainty.
* **No Demographic Profiling:** The merchant dashboard evaluates **catalogue variety**, not customer demographic demand or ethnic assumptions.
* **Consent-First:** User selfies are processed strictly for real-time analysis and are never persisted or shared without explicit permission.
* **Clinical Boundary:** Fitzpatrick phototype classifications are derived mathematically from Individual Typology Angle ($ITA^\circ$) for tonal depth reference, and explicitly disclaim medical diagnostic utility.
