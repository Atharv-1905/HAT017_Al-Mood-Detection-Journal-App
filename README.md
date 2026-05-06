# MindTrace AI+

MindTrace AI+ is an advanced, AI-powered emotional wellness and journaling platform. It leverages state-of-the-art NLP models to detect user emotions in real-time as they write, offering immediate insights, personalized wellness suggestions, and automated crisis management (SOS triggers).

## 🚀 Features

*   **Real-time Emotion Sensing:** Analyzes text as you type to detect emotions (joy, sadness, anger, fear, etc.), sentiment, and an overall wellness index.
*   **Safety Interventions:**
    *   **Breathing Mode:** Triggers a calming, guided breathing exercise if signs of acute distress or anxiety are detected.
    *   **SOS Guardrail:** Automatically provides emergency lifelines (e.g., 988) and can trigger alerts to emergency contacts if critical risk is detected.
*   **Rich Analytics Dashboard:** Visualizes mood trends over time (Daily, Weekly, Monthly) with interactive line and pie charts.
*   **Personalized Wellness:** Provides contextual suggestions tailored to the user's selected interests and current emotional state.
*   **Calm & Premium UI:** Built with React, Tailwind CSS, and Framer Motion for a fluid, accessible, and soothing user experience.

---

## 🏗️ Project Architecture

This project is built using a modern microservices architecture:

*   **`apps/web/`**: The frontend Single Page Application (SPA). Built with React (Vite), Tailwind CSS v3, Recharts, and Framer Motion.
*   **`services/backend-core/`**: The core backend API and ML orchestrator. Built with FastAPI (Python) and MongoDB. Handles authentication, AI model interaction, and journal storage.
*   **`services/backend-node/`**: Auxiliary Node.js backend. Handles Express routing, complex MongoDB aggregations for analytics, and user profile management.
*   **`services/ml-engine/`**: (Optional/Standalone) Dedicated machine learning service.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher) & npm
*   **Python** (3.9 or higher)
*   **MongoDB** (Local instance or MongoDB Atlas cluster)

---

## ⚙️ Setup & Installation

### 1. Database Configuration
Ensure you have a MongoDB cluster ready. Update the connection string in both backend `.env` files.

### 2. Backend Setup (FastAPI - Core)

The core backend handles AI processing, auth, and main journal logs.

1.  Navigate to the core backend directory:
    ```bash
    cd "services/backend-core"
    ```
2.  Create and activate a virtual environment:
    *   Windows: `python -m venv venv` and `venv\Scripts\activate`
    *   macOS/Linux: `python3 -m venv venv` and `source venv/bin/activate`
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure Environment Variables:
    *   Copy the example: `cp .env.example .env`
    *   Edit `.env` and set your `MONGO_URI` connection string.
    *   Ensure `MONGO_DB_NAME` is set (e.g. `mindtrace_ai`).
    *   Generate a secure `JWT_SECRET` (e.g. `openssl rand -hex 64`).
    *   If using HuggingFace hosted models, you can optionally add `HF_TOKEN` to reduce rate-limit issues.
5.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    *The API will be available at `http://localhost:8000`.*
    *Readiness check is available at `http://localhost:8000/ready`.*

### 3. Backend Setup (Node.js - Analytics)

The Node.js service handles complex data aggregations for the dashboards.

1.  Navigate to the Node.js service directory:
    ```bash
    cd "services/backend-node"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    *   Copy the example: `cp .env.example .env`
    *   Edit `.env` and set your `MONGO_URI` and `PORT`.
4.  Start the Express server:
    ```bash
    npm run dev
    ```
    *The server will run on `http://localhost:5000`.*

### 4. Frontend Setup (React/Vite)

1.  Navigate to the web app directory:
    ```bash
    cd "apps/web"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    *   Copy the example: `cp .env.example .env`
    *   Set `VITE_API_BASE_URL` to point to your running FastAPI backend (e.g. `http://localhost:8000/api/v1`).
4.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    *The frontend will be available at `http://localhost:5173/`.*

---

## 🧪 Testing the Application

### API Smoke Test (Recommended)

Run this from the repository root after backend services are up:

```powershell
.\scripts\api-smoke-test.ps1
```

This validates:

1.  Signup and login
2.  Real-time text analysis (`/analyze-live`)
3.  Journal persistence (`/save-journal`)
4.  Ambient vision analysis (`/analyze-vision-live`)
5.  Facial emotion logs create/list (`/facial-emotion-logs`)
6.  SOS flow (`/trigger-sos`)
7.  Dashboard aggregation (`/dashboard-analytics`)

### Manual UI Walkthrough

1.  Open `http://localhost:5173/`.
2.  Complete Sign Up or Login from the onboarding flow.
3.  In **Journal**, type text and watch live sensing update.
4.  Save an entry, then open **Analytics** to verify updates.
5.  Keep the page open for at least 15 seconds to test ambient camera capture and interventions.

---

## 🛡️ Security Note

Never commit real database credentials, JWT secrets, or provider tokens to version control.

*   All `.env` files are excluded via `.gitignore`. Only `.env.example` templates are tracked.
*   Before pushing to GitHub, rotate any credentials already used in local `.env` files.
*   Use deployment-time environment variables (GitHub Actions secrets, Render/Vercel secrets, etc.).
