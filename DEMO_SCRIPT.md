# ShadeProof — Hackathon Video Demonstration Script (2 Minutes 30 Seconds)
**Competition:** YouCam API Skin AI & eCommerce VTO Hackathon 2026  
**Project:** ShadeProof — AI Foundation Shade Matcher & Virtual Try-On  
**Presenter:** Engineering Lead / Founder  
**Target Duration:** 2 minutes 30 seconds (150 seconds)  
**Speaking Rate:** ~135–145 words per minute (natural, confident, unhurried)

---

## Screen & Audio Cue Matrix

| Timestamp | Screen Action | Spoken Narration | Focus & Hackathon Criteria |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:18** <br>*(18 sec)* | **Landing Screen (`ShadeFinderView`):** <br>Mouse hovers over the clean hero title *"Find Your Foundation Shade with Objective Color Science"* on the ivory and charcoal interface. | *"Buying foundation online is notoriously frustrating. Swatches on digital screens rarely match real skin, leading to return rates exceeding 30% across beauty eCommerce. Shoppers are forced to guess. **ShadeProof** solves this by connecting Perfect Corp's YouCam Skin AI to mathematical color matching, virtual try-on, and real-time merchant catalogue insights."* | **Problem Hook:** <br>Addresses high return rates and shade uncertainty in digital retail. |
| **0:18 – 0:30** <br>*(12 sec)* | **Top Navigation & Status Pill:** <br>Click the persistent status pill (`Sandbox Demo` or `Live YouCam`) in the top navbar. The Diagnostics Drawer smoothly opens. Hover over the gateway host (`https://yce-api-01.makeupar.com`) and close it. | *"First, transparency for our judges: In the top navigation, our diagnostic status pill shows the exact backend execution mode. Whether running in Live YouCam API mode or deterministic sandbox demo mode, credentials stay securely server-side—giving judges full visibility into our API pipeline."* | **Judge Transparency:** <br>Explicitly demonstrates backend configuration without hiding API mode. |
| **0:30 – 0:52** <br>*(22 sec)* | **Selfie Upload & YouCam Skin AI Analysis:** <br>Click *"Select Verified Demo Portrait"* (or upload a selfie). Check the privacy consent box and click *"Analyze My Skin Tone"*. The loading state pulses briefly, then renders `AnalysisResultsStep`. | *"Let's find our match. We provide our selfie and give consent. ShadeProof securely stages the asset with YouCam's file API and triggers the Skin Tone Task. Here are the genuine normalized results: CIELAB coordinates, an Individual Typology Angle of 36.2 degrees, and Fitzpatrick Type III with a warm undertone. We don't invent confidence percentages—we rely on dermatological metrics."* | **YouCam AI Integration (API 1):** <br>`POST /s2s/v2.0/file`<br>`POST /s2s/v2.0/task/skin-tone`<br>Real CIELAB & ITA metrics. |
| **0:52 – 1:18** <br>*(26 sec)* | **Brand/Finish Filter & CIEDE2000 Matching:** <br>Under *"Narrow By Brand & Finish"*, select *"Aura Botanica"* and *"Natural Satin"*. Click *"Find My Best Matches"*. The three candidate cards appear with $\Delta E_{00}$ badges. | *"Before ranking, shoppers can narrow by their preferred brand and finish. Our engine applies these constraints before ranking the catalogue using CIEDE2000 color difference—the international standard for color delta ($\Delta E_{00}$). Rank number one is 'Medium Warm Amber' with a $\Delta E_{00}$ of 0.82. We display the mathematical color distance transparently rather than claiming a 100% guarantee."* | **Matching Engine & User Controls:** <br>Pre-ranking catalogue filtering, Sharma CIEDE2000 math, undertone compatibility. |
| **1:18 – 1:50** <br>*(32 sec)* | **Virtual Try-On & Comparison Slider:** <br>Click *"Try On This Shade"*. The screen transitions to `TryOnStep`. Drag the smooth before/after comparison slider left and right across the face. Click *"Swatch Compare"* to pop open the comparison modal, then close it. | *"Now we see the foundation on the shopper's face using YouCam's Foundation Virtual Try-On API. Our split slider uses native CSS clip-paths, maintaining 1:1 portrait aspect ratio without horizontal stretching. Notice there's zero fake CSS tint—this is the pure YouCam render. Shoppers can open our Swatch Comparison modal to view the analyzed skin swatch alongside the product pigment, with clear notes on formula finish, oxidization, and ambient lighting."* | **YouCam Makeup VTO (API 2):** <br>`POST /s2s/v2.0/task/makeup`<br>Undistorted before/after comparison, no CSS overlays, honest color science. |
| **1:50 – 2:18** <br>*(28 sec)* | **Merchant Insights Dashboard:** <br>Click *"Merchant Insights"* in the top navigation. Scroll to the 20-cell Depth × Undertone Coverage Matrix. Point out the red *"Critical Gap"* cell (e.g., Deep Cool) and click *"Assortment Restock Simulator"*. Show simulated coverage rise from 79% to 92%. | *"Shade matching is only half the equation. We built **Merchant Insights** to help retailers identify coverage gaps. This 20-cell Depth by Undertone matrix aggregates real catalogue inventory. A merchant can instantly spot vulnerabilities—like out-of-stock Deep Cool shades. With our Restock Simulator, merchants can project inventory investments and export assortment data directly to CSV."* | **eCommerce Value:** <br>Actionable merchant analytics, inventory gap detection, restock simulation. |
| **2:18 – 2:30** <br>*(12 sec)* | **Return to App Header & Closing Hook:** <br>Click *"Shade Finder"* to return home. Pause on the polished UI. | *"Foundation shopping shouldn't be guesswork for consumers or a blind spot for retailers. ShadeProof bridges YouCam's visual AI with rigorous color science and commercial utility. Thank you."* | **Memorable Closing:** <br>Concise, professional finish within the 2:30 limit. |

---

## Presenter Rehearsal Checklist

### Before Pressing Record
1. **Screen Resolution:** Set browser display to 1080p (1920×1080) at 100% zoom.
2. **Local Services Running:**
   - Backend: `python -m uvicorn app.main:app --reload --port 8000`
   - Frontend: `npm run dev` (Vite running on `http://localhost:5173`)
3. **Database Populated:** Verify the 24-shade multi-brand database is seeded (`shadeproof.db`).
4. **Execution Mode Check:**
   - Check the navbar status pill. If recording with live credentials, confirm the green `Live YouCam` pill is active. If recording in demo mode, confirm the amber `Sandbox Demo` pill is active.

---

## Contingency & Backup Plan (If Live API Fails or Rates Limit During Recording)

> [!IMPORTANT]
> If a live YouCam API request experiences a network timeout, rate limit (HTTP 429), or authentication hiccup during your recording, **do not panic or stop recording**.

### What to Do:
1. **Rely on the Diagnostics Status Pill:**
   - Click the status pill in the top navigation bar.
   - Say: *"Our application is built with fault tolerance. When offline or during rate limits, ShadeProof seamlessly activates calibrated sandbox evaluation fixtures to ensure zero presentation downtime."*
2. **Why Judges Value This:**
   - In hackathons, API rate limits and network latency are expected.
   - Showing an intentional, robust fallback mechanism with clear status disclosures proves senior architectural maturity and operational resilience.
   - You never have to disguise sandbox fixtures as live calls; the system explicitly labels them as verified fixtures.

---

## Strict Honesty & Compliance Guidelines

- **No "Clinical Validation" Claims:** Describe CIEDE2000 as the *standard spectrophotometric color distance formula*, not a clinical dermatological diagnostic.
- **No "Perfect Match Guarantee":** Explicitly note that digital $\Delta E_{00}$ calculations under D65 daylight provide an objective ranking baseline, but physical foundation matches are influenced by formula finish (matte vs. radiant), skin type, coverage level, and oxidization.
- **No Invented Business Metrics:** Reference the 20-cell matrix and inventory stock levels from the real SQLite database—do not invent fake customer survey statistics or conversion rate percentages.
