# ShadeProof — Hackathon Submission Description
**Project Name:** ShadeProof — AI Foundation Shade Matcher & Virtual Try-On  
**Hackathon:** YouCam API Skin AI & eCommerce VTO Hackathon 2026  
**Category:** Skin AI & eCommerce Virtual Try-On  
**Repository:** [https://github.com/akhilsai132007/ShadeProof](https://github.com/akhilsai132007/ShadeProof)  
**Demo Video:** [https://youtu.be/ShadeProofDemo2026](https://youtu.be/ShadeProofDemo2026) *(Add your recording link)*

---

## 1. Problem Statement

Buying foundation online remains one of the highest-friction categories in retail:
* **The Consumer Dilemma:** Digital color swatches rendered on RGB screens bear little resemblance to real human skin under ambient lighting. Over **30%** of online foundation purchases are returned due to incorrect shade choices, leaving shoppers frustrated and reluctant to repurchase.
* **The Retailer Blind Spot:** Beauty merchants lack diagnostic tools to evaluate whether their foundation catalogue genuinely covers diverse complexions. Out-of-stock shades in specific undertone or depth segments create silent cart abandonment and costly return logistics.
* **The Trust Gap:** Generic AI beauty apps often display fabricated "99% match" percentages without explaining how the score was calculated or whether the formula actually suits the shopper's skin.

---

## 2. The Solution

**ShadeProof** connects Perfect Corp's official YouCam Skin AI and Makeup Virtual Try-On APIs with an objective, mathematically grounded color-difference matching engine and an actionable merchant assortment analytics suite.

Rather than guessing from static photos, ShadeProof provides an end-to-end consumer-to-merchant bridge:
1. **Intake & Consent:** Privacy-first portrait capture with lighting guidance or 1-click demographic evaluation portraits.
2. **YouCam Skin-Tone Analysis AI:** Dispatches selfies to YouCam's official S2S v2.0 API, extracting dermatological CIELAB coordinates, Individual Typology Angle ($\text{ITA}^\circ$), and Fitzpatrick phototypes.
3. **Pre-Ranking Consumer Filters:** Allows shoppers to narrow recommendations by brand and finish directly derived from the catalogue.
4. **Sharma CIEDE2000 Matching Engine:** Evaluates shades against the active database using the international standard **CIEDE2000 ($\Delta E_{00}$)** perceptual color difference formula, transparently displaying numerical color distance.
5. **YouCam Makeup Virtual Try-On:** Renders the selected shade on the user's face with adjustable pigment, coverage, and dewy finish parameters.
6. **Undistorted Before/After Comparison:** An accessible split slider using CSS `clip-path` that preserves 1:1 portrait proportions without horizontal distortion, with **zero fake CSS tint overlays**.
7. **Merchant Assortment Analytics:** A 20-cell Depth $\times$ Undertone matrix that identifies catalogue coverage gaps, simulates restock investments, and exports reports to CSV.

---

## 3. Target Users

* **Online Cosmetics Shoppers:** Seek to find their closest foundation shade without visiting a physical retail store, understand why a shade matches, and see how the product renders before buying.
* **Beauty eCommerce Merchandisers & Brands:** Need an objective audit of their foundation catalogue variety across 20 distinct skin-tone segments, actionable gap alerts, and inventory restock simulations.

---

## 4. YouCam API Integration Architecture

ShadeProof implements the official Perfect Corp YouCam S2S v2.0 REST API suite through a secure, asynchronous Python/FastAPI service layer:

```text
+-------------------------------------------------------------------------+
|                    Perfect Corp YouCam S2S Cloud API                    |
|                                                                         |
|  1. POST /s2s/v2.0/file              -> 2-Step AWS S3 Presigned Upload  |
|  2. POST /s2s/v2.0/task/skin-tone    -> Async Skin Color AI Task        |
|  3. POST /s2s/v2.0/task/makeup       -> Async Foundation VTO Render     |
+------------------------------------+------------------------------------+
                                     ^
                                     | Server-Side HTTPS (Bearer Auth)
                                     v
+------------------------------------+------------------------------------+
|                       ShadeProof Backend Gateway                        |
|                                                                         |
|  - Python 3.13 + FastAPI + SQLAlchemy 2.0 (SQLite Database)             |
|  - Automated Status Polling with Exponential Backoff                    |
|  - Defensive Response Normalization & CIELAB Coordinates Derivation     |
|  - Server-Side YOUCAM_API_KEY Security (Zero Keys Exposed to Client)    |
|  - Seamless Sandbox Demo Mode Fallback for Presentation Reliability     |
+------------------------------------+------------------------------------+
                                     ^
                                     | Typed JSON REST API
                                     v
+------------------------------------+------------------------------------+
|                       ShadeProof React 19 Frontend                      |
|                                                                         |
|  - Luxury Editorial UI (Ivory #FDFBF7, Charcoal #23201E, Gold #C5A880)  |
|  - Persistent Execution Diagnostics Pill (Live vs. Sandbox Transparency)|
|  - Undistorted Split Comparison Slider (CSS clip-path)                  |
|  - Visual Swatch Comparison Modal & Merchant Assortment Matrix          |
+-------------------------------------------------------------------------+
```

### Documented API Workflows
1. **File Upload Handshake (`POST /s2s/v2.0/file`):** Registers asset metadata and receives a presigned AWS S3 upload URL. Image bytes stream directly to S3 storage, returning a unique `file_id`.
2. **Skin Tone Task (`POST /s2s/v2.0/task/skin-tone`):** Triggers AI face detection and facial chromatic analysis. The backend polls until completion, defensively normalizing CIELAB ($L^*, a^*, b^*$), Individual Typology Angle ($\text{ITA}^\circ$), and undertone classification.
3. **Makeup Virtual Try-On (`POST /s2s/v2.0/task/makeup`):** Transmits `src_file_id`, candidate foundation HEX color, color intensity, coverage opacity, and glow finish to generate a rendered photorealistic image.
4. **Execution Transparency & Zero-Key Security:** The client never touches or stores API credentials. A persistent status pill in the top navigation reveals whether the app is executing against the live YouCam gateway or operating in calibrated sandbox demo mode.

---

## 5. The Foundation Matching Engine

ShadeProof replaces opaque heuristics with peer-reviewed colorimetry:

* **sRGB $\to$ CIELAB D65 Conversion:** Converts catalogue and user hex codes to CIE $L^*, a^*, b^*$ coordinates using the standardized CIE D65 reference white illuminant with inverse gamma compounding.
* **Sharma et al. (2005) CIEDE2000 Formulation:** Calculates $\Delta E_{00}$ color distance, accounting for lightness non-linearities, chroma weighting, and hue-rotation interactions. Fully benchmarked against published test dataset pairs.
* **Undertone Compatibility Matrix:** Applies calibrated penalties when a candidate shade conflicts with the user's undertone (e.g., Warm skin paired with Cool pink foundation), ensuring optical harmony.
* **Dynamic Pre-Ranking Filtering:** Filters catalogue candidates by selected Brand and Finish *prior* to ranking, guaranteeing that users receive the mathematically closest match within their preferred brand.
* **Honest Scoring Metrics:** Displays the exact $\Delta E_{00}$ value (e.g., $\Delta E_{00} = 0.82$) and categorical match tiers (Exact Match, Close Match, Tolerable Match) rather than deceptive 100% certainty scores.

---

## 6. Value Proposition

### Consumer Value
* **Objective Confidence:** Shoppers see their actual spectrophotometric color distance ($\Delta E_{00}$) explained in clear terms.
* **Visual Verification:** The undistorted split slider lets shoppers compare their bare skin directly to the applied foundation.
* **Swatch Comparison Modal:** Shoppers can inspect their analyzed skin sample swatch side by side with the foundation swatch.
* **Privacy by Design:** Selfies are processed in memory and never persisted without consent.

### Merchant Value
* **20-Cell Assortment Matrix:** Merchandisers can audit their foundation coverage across a $5 \times 4$ grid (Fair, Light, Medium, Tan, Deep $\times$ Warm, Neutral, Cool, Olive).
* **Vulnerability & Gap Alerts:** Automatically highlights single-point-of-failure SKUs and critical out-of-stock segments.
* **Restock Simulator & CSV Export:** Merchandisers can simulate inventory rebalancing, visualize coverage score improvements, and export assortment planning sheets directly to CSV.

---

## 7. Known Limitations & Responsible Disclosures

To maintain strict scientific and technical honesty:
1. **Spectrophotometric Baseline vs. 3D Facial Reality:** $\Delta E_{00}$ evaluates flat optical color distance under standardized D65 daylight. On a 3D face, facial curvature, micro-shadows, and ambient light temperature will create subtle variations.
2. **Formula Finish & Texture:** Matte formulations absorb ambient light and may appear slightly deeper on dry skin; radiant dewy finishes reflect light and appear lighter.
3. **Coverage Sheerness:** Sheer skin tints blend forgivingly across natural skin tones even with a $\Delta E_{00} \approx 2.0-3.0$; full-coverage foundations require tighter alignment.
4. **Formula Oxidization:** Certain liquid foundation oils interact with facial sebum and air over 2–4 hours, shifting hue slightly deeper.
5. **No Visual Indistinguishability Guarantee:** While $\Delta E_{00} < 1.5$ is near the laboratory "Just Noticeable Difference" (JND) threshold, ShadeProof explicitly disclaims that any algorithm can guarantee indistinguishability to every human observer across all lighting conditions.
6. **No Demographic Profiling:** The merchant dashboard evaluates **catalogue inventory variety**, not customer demographic demand or ethnic assumptions.

---

## 8. Verification & Test Suite Summary

* **Backend Tests:** **50 / 50 passing tests** (`python -m pytest -v`) verifying database initialization, Sharma CIEDE2000 math, brand/finish filters, merchant aggregations, S2S polling loops, diagnostics security, and error handling.
* **Frontend Build:** Passing cleanly (`tsc -b && vite build`) with zero errors and zero warnings.
* **License:** Open-source MIT License.
