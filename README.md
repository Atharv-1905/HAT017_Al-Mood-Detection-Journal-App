# 🧠 MindTrace AI+
**Real-Time Emotional Intelligence & Wellness Support System**

MindTrace AI+ is a premium, cross-platform web application that acts as an intelligent journal. It uses state-of-the-art Hugging Face NLP transformers to instantly analyze your daily entries, classify your emotions, calculate an Emotional Wellness Index, and provide personalized mental health recommendations.

---

## 🛠️ Technology Stack
* **Frontend:** React, Vite, Framer Motion, Recharts
* **Backend:** FastAPI, Python, Uvicorn, Motor (Asyncio)
* **Database:** MongoDB Atlas Cloud
* **AI Engine:** Hugging Face Transformers (`DistilRoBERTa` for Emotion, `Twitter-RoBERTa` for Sentiment)
* **Security:** BCrypt Hashing, JWT Tokens

---

## 🚀 How to Run the App Locally

### 1. Start the AI Backend (FastAPI)
```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 2. Start the Mobile Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Start the Laptop/Desktop Frontend
```bash
cd frontend_laptop
npm install
npm run dev
```

---

## 🌟 Key Features
* **Cross-Platform Interfaces:** Features a distinct mobile interface with a bottom tab bar, and a professional desktop interface with a top navigation bar.
* **Cloud Synchronization:** All data is securely stored in MongoDB Atlas and synced across devices in real-time.
* **Smart Re-Analysis:** When editing a journal, the AI can recalculate the emotional metrics on the fly without blocking the UI.
* **Hackathon Demo Mode:** The frontend gracefully simulates an AI response and stores data locally if the user is not authenticated.
