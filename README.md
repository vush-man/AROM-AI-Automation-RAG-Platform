# AROM — Autonomous Enterprise Intelligence Layer

A full-stack AI-powered enterprise intelligence system that uses **Retrieval-Augmented Generation (RAG)** and decision logic to understand, link, and act on enterprise data in real-time. Features a streaming chatbot with Gmail integration, persistent memory, and a premium React UI.

AROM is designed to evolve into a central decision layer across enterprise tools — replacing manual routing, reducing meeting overhead, and enabling AI-assisted operations at scale.

Unlike traditional document chatbots, AROM links multi-source enterprise data and applies decision logic to recommend actions — not just answers.

> Transforming enterprise data chaos into structured, actionable decisions.

---

> [!NOTE]
> **This is a demo/prototype version.** The current build showcases core functionality and architecture. Production-level tools, security hardening, and additional features will be added as the project moves into the production phase.

---

## 🚨 The Problem

Enterprises operate on fragmented data — emails, invoices, CRM logs, vendor complaints, customer feedback, and internal threads — scattered across disconnected systems, creating operational friction at scale.

Most of this data is manually processed — read, categorized, forwarded between departments, and discussed in meetings.

There is no intelligent reasoning layer connecting this information.

This leads to operational delays, approval bottlenecks, meeting overhead, lost context across systems, manual decision fatigue.

---

## 💡 The Solution - AROM

**AROM is an AI-powered enterprise intelligence layer** that sits above
your existing tools (Email, CRM, Documents, Policies) and:

- Understands incoming unstructured data
- Links related documents across systems
- Extracts entities (invoice IDs, vendors, policies)
- Detects urgency and sentiment
- Recommends actions
- Provides confidence-based decision scoring

AROM doesn’t just answer questions — it reduces enterprise decision latency.

---

## 🧠 Core Capabilities

### 🔍 Cross-Document Reasoning

- Retrieve invoice records from email references
- Link vendor complaints to payment policies
- Detect CRM inconsistencies
- Identify approval bottlenecks

### 📧 Multi-Source Data Understanding

- Email analysis & categorization
- Invoice interpretation
- Policy-aware reasoning
- CRM note linking

### ⚙️ Decision Intelligence

- Suggest next actions (AUTO / REVIEW / MANUAL)
- Provide confidence scores
- Highlight reasoning trace
- Draft contextual responses

### 🧵 Context Preservation

- Persistent memory via SQLite checkpoints
- Source transparency (documents used in reasoning)
- Tool-call visibility in UI

---

## 🔎 Example Workflow

**Scenario:**
A vendor emails about unpaid invoice `INV-2045`.

AROM automatically:

1. Retrieves the invoice record from vector store
2. Checks Payment Processing Policy 2024
3. Detects overdue status
4. Identifies responsible department
5. Suggests escalation path
6. Drafts a reply
7. Assigns confidence score

No meeting required.

---

## ✨ Features

### 🤖 AI Chatbot

- **Real-time Token Streaming** — AI responses appear word-by-word via Server-Sent Events (SSE)
- **RAG-Powered Answers** — Retrieves relevant context from your documents using FAISS vector search
- **Markdown Rendering** — Responses are formatted with bold, italic, lists, code blocks, and more
- **Persistent Memory** — Conversation history is retained across sessions using SQLite checkpoints
- **User Fact Extraction** — Remembers your name and personal details across conversations
- **Confidence Scoring** — Each response includes a confidence percentage and decision level (AUTO / REVIEW / MANUAL)
- **Tool Call Transparency** — The UI shows which tools the AI is calling (Document Search, Gmail Analysis) and which source documents were used, in real-time

### 📧 Gmail Intelligence

- **Email Analysis** — Fetches and categorizes emails (invoice, networking, event, promotional)
- **Priority Assignment** — Automatically assigns high/medium/low priority to emails
- **Sentiment Detection** — Analyzes email sentiment (positive, negative, neutral)
- **Smart Filtering** — Searches for important, urgent, or topic-specific emails

### 🔐 Authentication

- **JWT-Based Auth** — Secure signup/login with hashed passwords (bcrypt)
- **Protected Routes** — Dashboard pages require authentication
- **Session Persistence** — Stays logged in via localStorage tokens

### 📊 Dashboard

- **AI Chat (Overview)** — Main chatbot interface with streaming and feedback
- **Analytics** — Visual charts and statistics for query history
- **History** — Browse past conversations and responses
- **Feedback System** — Thumbs up/down with correction input to refine AI answers

### 🎨 UI/UX

- **Premium Dark Mode** — Sleek dark theme with accent colors and glassmorphism effects
- **Vortex Landing Page** — Animated particle background on the landing page
- **Responsive Layout** — Sidebar navigation with collapsible menu
- **Smooth Animations** — Framer Motion transitions and scroll-reveal effects

---

## 🛠 Prerequisites

Ensure you have the following installed before starting:

| Tool | Version | Download |
| --- | --- | --- |
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.11+ | [python.org](https://www.python.org/) |
| **Ollama** | Latest | [ollama.com](https://ollama.com/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vush-man/AROM-AI-Automation-RAG-Platform.git
cd AMD-Slingshot
```

### 2. Ollama Models

Pull the required LLM models:

```bash
# Embedding model (for document indexing & search)
ollama pull qwen3-embedding:4b

# Chat model (for generating answers)
ollama pull qwen2.5:3b
```

### 3. Python AI Engine

```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Node.js Backend

```bash
cd backend
npm install

# Create your environment file
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
```

Edit the `.env` file and configure:

```env
PORT=5000
JWT_SECRET=your-secret-key-here
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_EMBEDDING_MODEL=qwen3-embedding:4b
OLLAMA_CHAT_MODEL=qwen3:4b
DB_PATH=./db/slingshot.db
TOP_K=5
CONFIDENCE_THRESHOLD=0.5
```

### 5. React Frontend

```bash
cd frontend
npm install
```

---

## 📄 Document Ingestion

Before using the chatbot, index your documents into the FAISS vector store:

1. Place your files (PDF, DOCX, TXT) into:

   ```bash
   backend/embeddings/docs/
   ```

2. Run the ingestion script:

   ```bash
   cd backend/rag
   python ingest_docs.py
   ```

   This creates a `faiss_index/` folder inside `backend/rag/` containing your searchable document vectors.

---

## 🏃 Running the Application

You need **3 terminal windows** running simultaneously:

### Terminal 1 — Python AI Server

```bash
cd backend/rag
python chatbot_server.py
```

> Runs on **<http://127.0.0.1:5001>**

### Terminal 2 — Node.js Backend

```bash
cd backend
npm run dev
```

> Runs on **<http://localhost:5000>**

### Terminal 3 — React Frontend

```bash
cd frontend
npm run dev
```

> Runs on **<http://localhost:5173>**

**Open your browser at [http://localhost:5173](http://localhost:5173)** 🚀

---

## 📁 Project Structure

```bash
AMD-Slingshot/
├── frontend/                    # React (Vite) frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/         # Landing page sections (Hero, Navbar, etc.)
│   │   │   ├── dashboard/       # Sidebar, TopHeader
│   │   │   └── ui/              # Reusable UI components (Vortex, SpotlightCard)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── dashboardpage/   # Overview, Analytics, History, etc.
│   │   ├── context/             # AuthContext (JWT state management)
│   │   ├── services/            # API client (streaming, feedback, auth)
│   │   └── hooks/               # Custom hooks (useScrollReveal)
│   └── package.json
│
├── backend/                     # Node.js + Python backend
│   ├── routes/                  # Express API routes
│   │   ├── auth.routes.js       # Signup, Login
│   │   ├── query.routes.js      # Chat queries (proxies to Python)
│   │   └── feedback.routes.js   # Thumbs up/down, corrections
│   ├── rag/                     # Python AI engine
│   │   ├── chatbot.py           # LangGraph chatbot with RAG + Gmail tools
│   │   ├── chatbot_server.py    # Flask API wrapper (streaming SSE)
│   │   ├── ingest_docs.py       # Document ingestion into FAISS
│   │   └── faiss_index/         # Vector store (auto-generated)
│   ├── embeddings/
│   │   ├── docs/                # Drop your documents here
│   │   └── embedder.js          # Node.js embedding helper
│   ├── db/                      # SQLite database
│   ├── auth/                    # JWT middleware
│   ├── utils/                   # Logger, cosine similarity
│   ├── requirements.txt         # Python dependencies
│   ├── package.json             # Node.js dependencies
│   └── .env.example             # Environment template
│
└── README.md
```

---

## 🔧 Gmail Integration (Optional)

To enable the Gmail intelligence feature:

1. Create a Google Cloud project and enable the **Gmail API**
2. Download your `credentials.json` and place it in `backend/rag/`
3. Run the chatbot once — it will prompt you to authenticate via browser
4. A `token.json` file will be created automatically for future use

Once configured, ask the chatbot things like:

- *"Do I have any important emails?"*
- *"Check my inbox for invoices"*
- *"Show me recent networking emails"*

---

## 🆘 Troubleshooting

| Issue | Solution |
| --- | --- |
| **"Error connecting to AI backend"** | Ensure `chatbot_server.py` is running on port 5001 |
| **"Ollama not found"** | Make sure the Ollama desktop app is running in the background |
| **Blank page after login** | Clear browser cache or localStorage |
| **FAISS index not found** | Run `python ingest_docs.py` after placing documents in `embeddings/docs/` |
| **Gmail tool errors** | Check that `credentials.json` and `token.json` exist in `backend/rag/` |

---

## 🧰 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite 7, React Router, Framer Motion, Recharts, Lucide Icons |
| **Backend (API)** | Node.js, Express, SQLite3, JWT, bcrypt |
| **AI Engine** | Python, Flask, LangChain, LangGraph, FAISS, Ollama |
| **LLM Models** | Qwen 2.5 (3B chat), Qwen 3 Embedding (4B) |
| **Integrations** | Gmail API (via LangChain Google Community) |

---

## 🗺️ Roadmap

This is a **demo product** — the following enhancements are planned for the production release:

- [ ] **Structured financial query engine** — Store extracted invoice fields in PostgreSQL and route aggregation queries (totals, GST, date ranges) to deterministic SQL instead of LLM-based RAG computation
- [ ] **Multi-user workspaces** — Team-based document collections and shared chat history
- [ ] **Role-based access control** — Admin, editor, and viewer permission levels
- [ ] **Cloud deployment** — Dockerized setup with CI/CD pipeline
- [ ] **Additional AI tools** — Calendar, Slack, CRM integrations, and many more automation tools
- [ ] **Advanced RAG** — Hybrid search, re-ranking, and chunk-level citations
- [ ] **Production security** — Rate limiting, input sanitization, and HTTPS enforcement
- [ ] **PostgreSQL migration** — Switch from SQLite to PostgreSQL for scalable, production-grade data storage
- [ ] **File management UI** — Upload, preview, and manage documents from the dashboard
- [ ] **Customizable LLM models** — Switch between Ollama, OpenAI, and other providers

---

## 🌍 Vision

AROM aims to become the autonomous reasoning layer between enterprise data systems and human teams - reducing manual processing, operational delays, and unnecessary decision meetings.

AROM is not another chatbot interface.
It is a foundational decision infrastructure layer for enterprise operations.

---

## 👥 Credits

| Contributor | Role |
| --- | --- |
| **Ayan Goswami** | AI Engine, Automation Tools & Embedding Code |
| **Aman Shah** | Backend Development |
| **Om Chaurasia** | Frontend Development |
