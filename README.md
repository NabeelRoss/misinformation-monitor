# Social Media Misinformation Monitor 🕵️‍♀️

A full-stack Trust & Safety tool designed to detect and visualize misinformation on social media platforms. This project combines a **Deep Learning Classifier** for real-time detection with an **Analytics Dashboard** for ecosystem monitoring.

## 🌟 Features

### 1. AI Misinformation Detector 🧠
* **Model:** Fine-tuned **DistilBERT** (Transformer) model trained on custom social media data.
* **Interface:** Interactive **Gradio** web app that allows users to paste text and receive an immediate credibility score.
* **Metrics:** Provides confidence scores and binary verdicts ("Likely Misinformation" vs. "Seems Genuine").

### 2. Trust & Safety Dashboard 📊
* **Visualizations:** Interactive charts tracking misinformation rates by platform, political leaning, and content category.
* **Live Feed:** A searchable table displaying post metadata, including toxicity scores, engagement metrics, and moderation actions.
* **Tech Stack:** Built with raw HTML5/CSS3 and **Chart.js** for lightweight, responsive performance.

## 📂 Project Structure

```text
misinformation-monitor/
│
├── train_and_launch.py      # Main script: Trains model & launches AI app
├── csvjson.json             # Dataset containing simulated social media posts
├── requirements.txt         # Python dependencies
├── README.md                # Project documentation
│
└── dashboard/               # Frontend Analytics Dashboard
    ├── index.html           # Main dashboard view
    ├── css/
    │   └── style.css        # Dashboard styling
    ├── js/
    │   └── script.js        # Chart logic and data handling
    └── data/
        └── csvjson.json     # Data source for the dashboard
