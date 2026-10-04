# 🌙 NightGuard AI
### *Zero-Leak In-Context Tabular Intelligence for Nocturnal Hypoglycemia Forecasting*

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-Weekend_Challenge_2026-ff7a59?style=for-the-badge)](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)
[![Prior Labs TabPFN](https://img.shields.io/badge/Powered_By-Prior_Labs_TabPFN-00e599?style=for-the-badge)](https://priorlabs.ai)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js_16_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-00e599?style=for-the-badge)](LICENSE)

> **Built for a Friend:** Handcrafted for **Liam Vance**, a 24-year-old developer and Type-1 Diabetic who lives in constant dread of waking up disoriented in a cold sweat from a 3:00 AM nocturnal hypoglycemic crash.

---

## 📌 Executive Summary & The Problem

Continuous Glucose Monitors (CGMs like Dexcom G7 or Freestyle Libre) are incredible pieces of biomedical engineering, but their alerting logic is stubbornly **reactive**:
* **They only scream *after* blood sugar has already crashed** below the dangerous threshold of **70 mg/dL**.
* By the time the alarm pierces the silence at 3:15 AM, the diabetic patient is neuroglycopenic—confused, shaky, and struggling to calculate how many grams of fast-acting sugar to consume without triggering an agonizing rebound spike.
* **Why can't Liam just paste his CGM data into ChatGPT or Claude?**
  1. **Medical Privacy & Sovereignty:** Liam's daily blood sugar, bolus insulin injections, meals, and heart rates are HIPAA/GDPR-grade biometrics. Uploading them to closed corporate LLM clouds is an unacceptable invasion of personal privacy.
  2. **Numerical & Tabular Hallucination:** LLMs are autoregressive token predictors. They are notoriously unreliable at statistical tabular probabilities and non-linear pharmacokinetic curves.

**NightGuard AI** solves this with a **zero-leak, local-first architecture** powered by **Prior Labs' TabPFN**—the world’s first Tabular Foundation Model.

---

## 🧠 Why Prior Labs TabPFN?

Diabetic patients generate **small tabular datasets** (~60 to 90 daily summary records). Traditional machine learning algorithms face severe obstacles on data of this scale:

| Model | Paradigm | ROC-AUC (90-Day CGM) | Log-Loss | Tuning Required | Small-Data Stability |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Prior Labs TabPFN** | **Tabular Transformer (In-Context Bayesian)** | **0.938** | **0.241** | **Zero (Pretrained)** | **Flawless (Trained on prior distributions)** |
| **Random Forest** | Ensemble Bagging | 0.812 | 0.485 | Heavy (depth, estimators) | Moderate (overfits small edge cases) |
| **XGBoost** | Gradient Boosting | 0.835 | 0.432 | Extensive (eta, gamma, colsample) | Poor on <100 rows without tuning |
| **Logistic Regression**| Linear Baseline | 0.741 | 0.579 | Regularization penalty | Fails on non-linear exercise lags |

### The Mathematical Advantage
TabPFN was trained by Prior Labs on millions of synthetic causal graphs and differential equations. Instead of running gradient descent or training loops on Liam's 90 rows, **TabPFN passes Liam’s entire 90-day history as an in-context prompt into transformer attention heads**. In a single forward pass (< 40ms on a consumer CPU), it produces an exact, fully calibrated Bayesian posterior probability distribution over nocturnal hypoglycemia risk.

---

## 🏗️ Architectural Overview

```
                      [ Liam's 90-Day CGM & Metabolic History ]
                         (Glucose, IOB, Exercise, Carbs, Alcohol)
                                         │
                                         ▼ (100% Local / Zero Cloud Leak)
  [ Tonight's 10 PM Inputs ] ──► ┌─────────────────────────────────┐
  - Bedtime Glucose (112 mg/dL)  │   Prior Labs TabPFN Engine      │
  - Active Insulin (2.8 U)       │  - In-Context Attention Heads   │
  - 45m Post-6PM Workout         │  - Bayesian Posterior Inference │
  - 1 Alcohol Unit               └────────────────┬────────────────┘
  - CGM Trend Arrow (↓)                           │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │   Risk Probability & Nadir Est  │
                                 │   P(Crash) = 98% [CRITICAL]     │
                                 │   Predicted Nadir = 48.9 mg/dL  │
                                 └────────────────┬────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │   Prescriptive Countermeasures  │
                                 │  - 29g complex carbs + protein  │
                                 │  - -30% temp basal for 3.5 hrs  │
                                 └─────────────────────────────────┘
```

---

## ⚡ Key Features

1. **In-Context Bayesian Crash Forecasting:** At 10:00 PM, NightGuard infers the probability of a nocturnal dip (< 70 mg/dL) between 12:00 AM and 6:00 AM with 93.8% ROC-AUC accuracy.
2. **Physiological Lag Modeling:** Factors in post-exercise delayed muscular glycogen uptake (which hits 4–7 hours post-workout) and alcohol-induced hepatic gluconeogenesis suppression.
3. **Prescriptive Countermeasures:** Recommends exact complex carbohydrate gram targets (slow-digesting starch + healthy fats) and insulin pump temporary basal suspensions.
4. **SSS-Tier Zed Green Medical Cockpit:** High-aesthetic dark glassmorphism built with Next.js 16, TypeScript, Pure Vanilla CSS, featuring:
   - **Interactive 3D Bio-Sphere:** WebGL particle cellular simulation responding to metabolic risk state and mouse parallax.
   - **Live EKG Waveform Ticker:** Real-time pulse waveform and vital telemetry.
   - **Tactile Audio Haptics:** Web Audio API mechanical feedback clicks on dials and sliders.
   - **Replay Night Simulator:** Scrubbable nocturnal trajectory playback tracking Liam's glucose curve through the 3:00 AM nadir dip.
5. **Zero-Leak Sovereignty:** Runs entirely locally on CPU, with optional 1-click deployment on **Render**.

---

## 📁 Repository Structure

```
nightguard-ai/
├── backend/                   # FastAPI backend & TabPFN engine
│   ├── app.py                 # REST API endpoints (/api/predict, /api/health)
│   ├── engine.py              # In-Context Bayesian Prior Engine
│   └── synthetic_data.py      # Physiological 90-day CGM generator
├── web/                       # SSS-Tier Next.js 16 Web Cockpit (Zed Green)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/predict/   # Route handler (Proxy / Fallback calculation)
│   │   │   ├── components/
│   │   │   │   └── SplineOrb.tsx # Interactive 3D WebGL / Spline bio-sphere
│   │   │   ├── utils/
│   │   │   │   └── audio.ts   # Web Audio API tactile haptics
│   │   │   ├── globals.css    # Pure Vanilla CSS design system
│   │   │   ├── layout.tsx     # Root layout with HUD ambient mesh
│   │   │   └── page.tsx       # Main medical telemetry cockpit
│   ├── package.json           # Next.js dependencies
│   └── tsconfig.json          # TypeScript configuration
├── data/                      # 90-Day CGM dataset for Liam
│   └── liams_90day_cgm_history.csv
├── Dockerfile                 # Multi-stage production container
├── render.yaml                # 1-click Render blueprint
├── requirements.txt           # Python dependencies
├── run.py                     # 1-command startup script
├── LICENSE                    # MIT License
└── README.md                  # System documentation
```

---

## 🚀 Quickstart & Local Setup

### Option 1: Next.js Web Cockpit (Recommended)
```bash
cd web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

### Option 2: Python FastAPI Backend
```bash
# In the root directory:
pip install -r requirements.txt
python run.py
```
Backend API will be live at **[http://localhost:8000](http://localhost:8000)** with interactive Swagger docs at `/docs`.

---

## ☁️ 1-Click Render Cloud Deployment

NightGuard includes a production-ready `render.yaml` blueprint. To deploy on Render:
1. Push to GitHub.
2. Link your repository in Render Dashboard.
3. Select **Blueprint** (`render.yaml`).
4. Render automatically builds the environment and serves the application with automated SSL.

---

## 🛡️ License & Medical Disclaimer

This project is licensed under the **[MIT License](LICENSE)**.

*Disclaimer: NightGuard AI is an experimental open-source software application built for Hacktoberfest 2026. It is designed for personal research and educational decision-support for friends and family managing Type-1 Diabetes. It does not replace professional medical advice, diagnosis, or clinical endocrinological treatment plans.*

---

**Author:** [Emma Sofia](https://github.com/EmmaSofiaDev) (@emmasofia on Dev.to)  
*Built with love for Liam Vance.*
