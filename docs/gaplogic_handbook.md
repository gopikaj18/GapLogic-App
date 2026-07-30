# GapLogic — System Architecture & Implementation Handbook

Welcome to the **GapLogic Handbook**. This document provides a comprehensive overview of the systems, architectures, database structures, and Machine Learning integrations implemented in the GapLogic application.

---

## 1. Application Overview
GapLogic is a cognitive habit-auditing dashboard that maps the discrepancy between a user's **intentions** (what they planned to do) and **reality** (what they actually completed). By tracking behavioral leaks, GapLogic helps users identify cognitive friction points and adjust their schedules through automated recommendations.

---

## 2. Core Features & User Workflows

### A. Intention Modeler (Cognitive Stack)
- **Purpose**: A scheduling board where users define daily targets.
- **Workflow**:
  - Name tasks and select domains (`Work`, `Health`, `Learning`, `Personal`).
  - Set predicted effort estimates on a scale from 1 to 5.
  - Define duration in minutes and scheduled start times.
  - **AI Feasibility Check**: Dynamically predicts the feasibility of completing the task using historical patterns while the user is typing.

### B. Focus Timer (Timeline Sync)
- **Purpose**: A focus workspace to run daily task stacks.
- **Workflow**:
  - Displays a progress bar and countdown timer for the active session.
  - Renders a **Predictive Behavioral Audit HUD** showing prediction confidence and suggestions prior to completing the task.
  - **Reality Sync**: Audits actual completion status (Completed/Missed), actual energy expenditure, and qualitative friction notes (fatigue, environmental distractions).

### C. Cognitive Dashboard
- **Purpose**: Visual analytics tracking behavioral statistics over time.
- **Charts**:
  - **Integrity Growth (Area Chart)**: Tracks the ratio of completed vs. planned tasks over a rolling 7-day window.
  - **Completion Status (Pie Chart)**: Breaks down total tasks into Completed vs. Missed blocks.
  - **Time Invested (Line Chart)**: Represents focus minutes invested daily.
  - **Consistency Volume (Bar Chart)**: Visualizes overall activity counts per day.

### D. Discrepancy Auditor & Pivot Engine
- **Purpose**: AI diagnostics that explain willpower leakage.
- **Output**:
  - **Behavioral Gaps**: Identifies specific intention deviations, listing the root cause and suggested insights.
  - **Strategic Pivots**: Generates 3 actionable recommendations categorized by domain (e.g. Time Management, Prioritization, Motivation).

---

## 3. Database Architecture (PostgreSQL Schema)
The PostgreSQL schema manages relational entities under a Railway instance.

```sql
-- Enable cryptographic helpers for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Intention Stack
CREATE TABLE IF NOT EXISTS intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('health', 'work', 'learning', 'personal')),
  effort_estimate INT NOT NULL,
  scheduled_time TEXT NOT NULL,
  estimated_duration INT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intentions_user_date ON intentions(user_id, date);

-- Reality Sync Logs
CREATE TABLE IF NOT EXISTS reality_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intention_id UUID NOT NULL REFERENCES intentions(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL,
  actual_effort INT NOT NULL,
  friction_note TEXT NOT NULL DEFAULT '',
  context_note TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON reality_logs(user_id, date);
```

---

## 4. Authentication & Session Security
- **Backend JWT Engine**: Implemented in `src/lib/auth-jwt.ts` and `src/lib/auth-server.ts`.
- **Session Lifespan**: Signed JSON Web Tokens (JWT) stored in a secure `gaplogic-session` HTTP-Only cookie.
- **API Guarding**: Middleware automatically intercepts and parses requests. Supported schemas:
  1. Cookie Session: `req.cookies.get('gaplogic-session')` (Web clients)
  2. Authorization Header: `Authorization: Bearer <JWT_Token>` (Mobile clients)

---

## 5. Machine Learning & AI Architectures

GapLogic runs a **hybrid prediction framework** combining generative Large Language Models with a lightweight mathematical neural classifier.

### A. Local LLM Genkit Integration (Gemma)
- **Engine**: Firebase Genkit initialized locally using the `genkitx-ollama` plugin and targeting the `gemma2:2b` model.
- **API Routes**:
  - `POST /api/ai/predict` (Outcome Feasibility Audit)
  - `GET /api/ai/insights` (Discrepancy Auditor & Pivot recommendations)
- **Gemma Resilience Features**:
  - **Trailing Comma Stripping**: The JSON parser contains regex cleaners that eliminate trailing commas from generated objects or arrays, avoiding syntax errors.
  - **Recursive Null Sanitization**: Converts any outputted `null` values into `undefined` to safely satisfy TypeScript Zod validations.
  - **Zod Fallback Defaults**: Discrepancy models contain fallback defaults (`z.string().default('')`) ensuring completed tasks are parsed safely without crashing the backend server.

### B. Mathematical Behavioral Classifier
- **Engine**: A custom classifier implemented in pure TypeScript (`src/ai/models/behavioral-classifier.ts`).
- **Algorithm**: Single-layer Perceptron (Logistic Regression) with Sigmoid activation:

$$\hat{y} = \sigma(w_0 x_0 + w_1 x_1 + w_2 x_2 + w_3 x_3 + b)$$

- **Dynamic Online Training**: When a prediction is requested, the classifier automatically retrieves the user's historical log sequences, normalizes features, and runs gradient descent optimization to fit custom weight parameters on the fly.
- **Input Features**:
  1. $x_0$: Normalized Effort estimate ($E_{\text{norm}} = \frac{E - 1}{4}$)
  2. $x_1$: Category-specific completion rate
  3. $x_2$: Time-of-day completion rate (Morning vs. Afternoon vs. Evening)
  4. $x_3$: Immediate previous task completion status (Markov state)

---

## 6. Mobile Application (React Native / Expo Go)
- **Folder**: `mobile/`
- **Navigation**: Managed via `expo-router` using file-based tabs (`Dashboard`, `Modeler`, `Focus`).
- **Sync Contexts**: Employs `DataContext` and `SessionContext` to persist tokens in phone memory (`AsyncStorage`) and make REST requests to the Next.js API endpoints.

---

## 7. Setup & Development Lifecycle

### Start Local Next.js & Database Migrations
```bash
npm install
npm run db:migrate
npm run dev
```

### Run E2E Integration Test Suite
Executes registration, populates DB logs, runs Gemma LLM predictions, trains the custom ML classifier, and executes the Discrepancy Auditor/Pivot Engine:
```bash
npx tsx scripts/test-integration.ts
```
