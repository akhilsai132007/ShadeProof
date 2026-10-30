# ShadeProof — Setup & Evaluation Guide
**Hackathon:** YouCam API Skin AI & eCommerce VTO Hackathon 2026  
**Project:** ShadeProof — AI Foundation Shade Matcher & Virtual Try-On

This guide provides instructions for judges and evaluators to set up, run, test, and evaluate ShadeProof locally from a clean repository clone.

---

## 1. Prerequisites

Before starting, ensure your system has the following installed:
* **Python 3.10+** (Python 3.13 recommended)
* **Node.js 18+** (Node.js 20+ recommended)
* **npm 9+**
* **Git**

---

## 2. Quickstart (Under 3 Minutes)

### Step 1: Clone Repository
```bash
git clone https://github.com/akhilsai132007/ShadeProof.git
cd ShadeProof
```

---

### Step 2: Backend Setup & Launch

1. **Navigate to the `backend` folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   Verify `backend/.env` exists. If not, copy from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Default `.env` configuration:*
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
   > **Note:** Leaving `YOUCAM_API_KEY` blank automatically launches the application in **Sandbox Evaluation Mode**, using verified YouCam S2S fixtures so you can evaluate the complete user journey without API credentials.

5. **Start the FastAPI backend:**
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * Interactive API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   * Diagnostics Endpoint: [http://127.0.0.1:8000/api/v1/diagnostics](http://127.0.0.1:8000/api/v1/diagnostics)
   * Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 3: Frontend Setup & Launch

1. **Open a new terminal and navigate to `frontend`:**
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
   * Access the application in your browser: [http://localhost:5173](http://localhost:5173)

---

## 3. Configuring Live YouCam S2S API Mode

To test live API calls against Perfect Corp's YouCam cloud:

1. Open `backend/.env` in your text editor.
2. Set your API key:
   ```env
   YOUCAM_API_KEY=your_actual_perfect_corp_key_here
   ```
3. Restart the FastAPI server.
4. Refresh [http://localhost:5173](http://localhost:5173). The status pill in the top navigation will automatically switch from amber `Sandbox Demo` to green `Live YouCam`.
5. Click the status pill to open the Diagnostics Drawer and click **"Test Connection"** to probe the gateway at `https://yce-api-01.makeupar.com`.

---

## 4. Running the Automated Test Suite

Execute the 50 automated backend unit and integration tests:

```bash
cd backend
python -m pytest -v
```

Execute the frontend production build and TypeScript check:

```bash
cd frontend
npm run build
```

---

## 5. Troubleshooting & FAQs

* **Port 8000 or 5173 already in use:**
  - Change backend port: `python -m uvicorn app.main:app --port 8001` (and update `VITE_API_BASE_URL` in `frontend/.env`).
  - Change frontend port: `npm run dev -- --port 3000`.
* **Missing database on startup:**
  - On launch, FastAPI automatically seeds `backend/shadeproof.db` with 24 diverse foundation shades across 2 brands.
* **Are API keys ever sent to the browser?**
  - **No.** ShadeProof strictly enforces server-side credential isolation. No keys exist in client bundles, `localStorage`, or public responses.
