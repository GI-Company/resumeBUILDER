# 🚀 Agent Rez — Enterprise AI Resume Engine & SAAS Builder

> **Outperforming Canva & Adobe Express in ATS Accuracy, Design Precision, and Autonomous Career Intelligence.**

Agent Rez is a high-performance, Next.js 15 enterprise SaaS platform designed to build, optimize, and render ATS-guaranteed vector resumes. Powered by an autonomous 5-agent AI cognitive system and a 3-stage serverless PDF rendering engine, Agent Rez bridges the gap between stunning visual design and 100% applicant tracking system (ATS) parseability.

---

## 🌟 Key Features

### 🤖 1. The Agent Rez Micro-Agent Suite
- **🔥 Rez-Gaze (Cognitive Gaze Profiler)**: Renders a real-time, 6-second recruiter eye-tracking visual heatmap over the editor canvas using the visual weight decay equation:
  $$W(x, y) = C_{\text{header}} \cdot e^{-\lambda_x x} + C_{\text{vertical}} \cdot e^{-\lambda_y y}$$
  Guarantees high-priority achievements land in prime recruiter focal paths.
- **📄 Rez-Parser (ATS Structural Sanitizer)**: Strips nested visual float/grid wrappers to create flat, linear ATS token streams and calculates real-time action-verb saliency scores.
- **📐 Rez-Balance (Whitespace & Layout Rebalancer)**: Solves the layout cost optimization function:
  $$C(\theta) = w_1(R_{\text{white}} - 0.40)^2 + w_2(H_{\text{total}} - H_{\text{target}})^2$$
  Dynamically balances font scaling, line height, and section padding to enforce a target 35%–50% whitespace ratio.
- **⚡ Rez-Sync (Atomic Hydration & State Engine)**: Manages transactional state synchronization with Supabase PostgreSQL to eliminate client-side hydration shifts and version conflicts.
- **🛡️ Rez-Render (Dynamic PDF Orchestrator)**: Manages vector serverless Chromium compilation with an automatic 9.5-second `AbortController` failover to high-DPI client canvas rendering.

---

### 🎨 2. WYSIWYG Interactive Editor & ATS Suite
- **Live Multi-Page Pagination**: Real-time sheet container splitting via `calcPages()` preventing split text or awkward mid-line cuts.
- **Real-Time ATS Score Breakdown**: Instant feedback modal checking bullet verb density, quantitative metrics, section completeness, and contact details.
- **Executive Typography & Palette Presets**: 12 curated executive design themes (Navy Corporate, Obsidian Gold, Emerald Creative, Sapphire Executive) with custom font pairings.
- **Visual Margin Rulers & Alignment Guides**: Toggleable inch/pixel rulers with print safe-area borders.

---

### 📥 3. Ingestion & AI Utility API Pipeline
- **Multi-Format Resume Ingestion**: Parse existing resumes from PDF, Word DOCX, or raw text into structured JSON schemas (`/api/resume/parse`, `/parse-doc`, `/parse-linkedin`).
- **Voice-to-Text Transcription**: Built-in voice input engine for hands-free resume bullet creation (`/api/resume/transcribe`).
- **Targeted Cover Letter Generator**: AI cover letter generator tailored to target job descriptions (`/api/cover-letter`).

---

## 📄 Enterprise 3-Stage PDF Rendering Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │            User Triggers PDF Export          │
                       └──────────────────────┬───────────────────────┘
                                              │
                                   [ Stage 1: Vector PDF ]
                       Puppeteer-Core + @sparticuz/chromium-min (Vercel)
                       Nuclear CSSOM Memory Extraction & Global Mutex
                                              │
                                        (Fails or > 9.5s?)
                                              ├───────────────┐
                                              │               │
                                           (Success)       (Timeout)
                                              ▼               ▼
                                       Vector PDF Download  [ Stage 2: Retina Canvas ]
                                                            html2canvas 3x + jsPDF
                                                            High-DPI Lossless Image Array
                                                              │
                                                        (Fails?)
                                                              ▼
                                                    [ Stage 3: Native Print ]
                                                    Browser Print Dialog Fallback
```

1. **Stage 1 (Serverless Chromium Vector PDF)**: Decoupled `puppeteer-core` with `@sparticuz/chromium-min` tarball extraction. Uses a global `downloadPromise` mutex cache to prevent concurrent `/tmp` disk exhaustion during cold starts.
2. **Stage 2 (High-DPI 3x Client Canvas Fallback)**: Client-side rendering powered by `html2canvas` at 3x scale and `jsPDF`. Enforces an `AbortController` (9.5s timeout) to swap seamlessly before Vercel Hobby execution limits.
3. **Stage 3 (Native System Print)**: Strict CSS `@media print` fallback for offline or emergency printing.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Vanilla CSS tokens (`app/globals.css`), Tailwind CSS
- **Database & Auth**: Supabase PostgreSQL (RLS enabled), Supabase Auth
- **AI Inference Engine**: Groq API (High-throughput Llama 3 / Mixtral models)
- **Browser Automation**: `puppeteer-core`, `@sparticuz/chromium-min`
- **Client Rendering**: `html2canvas`, `jspdf`, `motion/react`

---

## 💻 Getting Started Locally

### 1. Prerequisites
- Node.js 20+ or 22+
- npm / pnpm / yarn

### 2. Installation
```bash
# Clone repository
git clone https://github.com/GI-Company/resumeBUILDER.git
cd resumeBUILDER

# Install dependencies
npm install
```

### 3. Environment Variables Configuration
Copy `.env.example` to `.env.local` and set your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
CHROMIUM_PACK_URL=https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Vercel Production Deployment Notes

To deploy to Vercel without runtime execution issues:
1. In your **Vercel Project Dashboard** (Settings ➔ Environment Variables), declare:
   - **Key**: `AWS_LAMBDA_JS_RUNTIME`
   - **Value**: `nodejs22.x`
2. `next.config.ts` includes `serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min", "@sparticuz/chromium"]` to ensure heavy browser binaries are not bundled into Vercel function limits (250MB cap).

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
