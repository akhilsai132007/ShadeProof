# ShadeProof — Hackathon Video Demonstration Script (2–3 Minutes)
**Hackathon:** YouCam API Skin AI & eCommerce VTO Hackathon 2026  
**Project:** ShadeProof — AI Foundation Shade Matcher & Virtual Try-On  
**Presenter:** Engineering Lead / Founder  
**Target Duration:** 2 minutes 30 seconds  

---

### [0:00 – 0:30] Hook & The eCommerce Problem

**Visual:**
Open on the ShadeProof landing page hero (*"Find your closest foundation match. See it before you buy it."*).

**Spoken Script:**
> *"Online cosmetics shopping has a massive problem: foundation return rates consistently exceed 30%. Why? Because shoppers cannot physically swatch shades on their skin, and lighting makes choosing a shade from a catalog swatch pure guesswork.*
>
> *At the same time, beauty retailers have huge inventory blind spots—many don't realize their catalogues under-serve olive or deep complexions until customers abandon their carts.*
>
> *We built **ShadeProof** to solve both sides of this problem. We bridge Perfect Corp’s YouCam Skin AI and Virtual Makeup Try-On with an objective perceptual color matching engine and anAssortment Coverage Suite for merchants."*

---

### [0:30 – 1:15] Consumer Experience: Skin AI & Scientific Diagnostics

**Visual:**
1. Scroll down to Step 1 (Selfie Intake).
2. Point out the **Lighting Guidance** and **Data Privacy Consent Notice**.
3. Click the 1-Click Evaluation Portrait: **"Sofia — Medium Warm"** (or use live webcam / file upload).
4. Click **"Analyze Skin Tone & Undertone"**.
5. The screen transitions to Step 2: **Skin Diagnostics**.

**Spoken Script:**
> *"The consumer flow begins with privacy-first intake. The user can take a webcam snapshot, upload a photo, or test with our calibrated demo portraits. Notice our explicit consent disclosure—images are processed strictly in memory and are never persisted.*
>
> *When we click 'Analyze', ShadeProof stages the image via YouCam’s 2-step presigned S3 upload, triggers `/s2s/v2.0/task/skin-tone-analysis`, and polls for completion.*
>
> *Here is the diagnostic result: YouCam's AI extracts the facial chromatic baseline, depth level, and undertone. We also calculate the dermatological Individual Typology Angle (ITA) and calibrated CIE L\*a\*b\* coordinates under standard D65 illuminant—with an explicit disclosure that tone depth is colorimetric, not a medical Fitzpatrick diagnosis."*

---

### [1:15 – 1:50] The Matching Engine & Virtual Try-On

**Visual:**
1. Click **"Find Best Foundation Matches"**.
2. Transition to Step 3: Top 3 candidate foundation cards appear.
3. Highlight the visible **ΔE₀₀ (Delta-E)** values, ranking explanations, and **"Check Store Stock"** button.
4. Click **"Try On My Face (YouCam AR)"** on Candidate #1.
5. Transition to Step 4: Virtual Try-On comparison viewer. Toggle between **Side-by-Side** and **Split View**.
6. Move the coverage and pigment intensity sliders and demonstrate real-time optical blending.
7. Click **"Add to Bag"** to show eCommerce conversion.

**Spoken Script:**
> *"Now our standalone matching engine kicks in. We do not use fake ML scores or black-box guessing. We implement the peer-reviewed **Sharma CIEDE2000 standard** to evaluate perceptual color difference between the user's skin and our foundation catalogue, applying an undertone penalty matrix.*
>
> *Notice our transparency: the actual ΔE₀₀ distance is visible on every card, along with explanations of why each shade was ranked.*
>
> *When the user selects a shade, ShadeProof calls YouCam’s foundation makeup VTO endpoint: `POST /s2s/v2.0/task/makeup-vto`. The foundation pigment is rendered realistically onto their facial contours.*
>
> *Shoppers can switch between side-by-side and an interactive split-slider, fine-tune coverage opacity and dewy finish, and immediately checkout with confidence."*

---

### [1:50 – 2:30] Merchant Analytics: Assortment Matrix & Restock Simulator

**Visual:**
1. Click the **"Merchant Insights"** tab in the top navigation.
2. Highlight the **4 KPI Cards** (Active SKUs, Coverage Index 60%, Critical Gaps, Vulnerable Segments).
3. Walk through the **2D Assortment Heatmap Matrix** ($5 \text{ Depth} \times 4 \text{ Undertone}$).
4. Click a red cell (e.g., *Fair • Olive* or *Deep • Warm*). Show the **Segment Inspector**.
5. Click **"Simulate Sourcing +2 SKUs"** and watch the Coverage Index jump from 60% to 65%!
6. Click **"Export CSV Report"** to download the structured retailer planning spreadsheet.

**Spoken Script:**
> *"Now let's switch to the merchant perspective. Retailers need to know where their foundation catalogue is lacking.*
>
> *Our 2D Assortment Matrix maps all 20 depth and undertone intersections. It flags critical gaps—segments with zero formulated shades—and single-point-of-failure inventory.*
>
> *Notice our unique **Assortment Simulator**: merchants can model adding 2 SKUs to an underserved segment and immediately see their catalogue coverage score increase.*
>
> *And with one click, they can export a structured CSV report for their merchandising and procurement teams."*

---

### [2:30 – 2:50] Architectural Rigor & Conclusion

**Visual:**
1. Switch briefly to the **"About & Science"** tab or show the terminal with **39 passing automated tests**.
2. Point out the live backend status indicator in the top navbar.

**Spoken Script:**
> *"Under the hood, ShadeProof features a Python 3.13 FastAPI backend, React 19 frontend, 39 automated unit tests verifying Sharma benchmarks and YouCam API contracts, and a zero-dependency sandbox evaluation mode so judges can evaluate the platform seamlessly.*
>
> *ShadeProof turns foundation shopping from an uncertain gamble into a validated, visual, and delightfully confident eCommerce experience. Thank you!"*
