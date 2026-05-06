# 🧠 MindTrace AI+
**Real-Time Emotional Intelligence & Wellness Support System**

MindTrace AI+ is a premium, mobile-first web application that acts as an intelligent journal. It uses state-of-the-art Hugging Face NLP transformers to instantly analyze your daily entries, classify your emotions, calculate an Emotional Wellness Index, and provide personalized mental health recommendations.

---

## 🛠️ Technology Stack
* **Frontend:** React, Vite, Framer Motion, Recharts
* **Backend:** FastAPI, Python, Uvicorn
* **AI Engine:** Hugging Face Transformers (`DistilRoBERTa` for Emotion, `Twitter-RoBERTa` for Sentiment)

---

## 🚀 How to Run the App Locally

To run this application, you will need to start both the Python Backend and the React Frontend simultaneously.

### 1. Start the AI Backend (FastAPI)
The backend requires Python. Open a terminal in the root folder of this project:

```bash
# Install the required Python packages
pip install -r requirements.txt

# Start the server (binds to 0.0.0.0 so you can access it on mobile too!)
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
*(Note: The very first time you run this, it will download ~500MB of AI models from Hugging Face. Please be patient. It will boot instantly on subsequent runs.)*

### 2. Start the Frontend (React + Vite)
The frontend requires Node.js. Open a **second terminal**, navigate to the `frontend` folder, and start Vite:

```bash
# Navigate into the frontend directory
cd frontend

# Install the Node dependencies
npm install

# Start the development server
npm run dev
```

### 3. Open the App!
Once both servers are running, look at the terminal output from your Frontend. 
* To view on your PC: Click `http://localhost:5173`
* To view on your phone: Ensure your phone is on the same Wi-Fi network and type the `Network` IP address (e.g., `http://192.168.x.x:5173`) into Safari/Chrome.

---

## 🌟 Key Features
* **Hackathon Demo Mode:** The frontend gracefully simulates an AI response if the backend is down or downloading, ensuring your demo never crashes.
* **Fresh Mind Theme:** Toggle between a deep, premium Dark Mode and a soft, pastel Light Mode.
* **Persistent Data:** Entries are securely saved to your browser's local storage.
* **Interactive Analytics:** Generates beautiful trendline graphs to track your wellness score over time.
