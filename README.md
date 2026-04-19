# 🌀 WorkLoop — Internal IT Workflow Management System

WorkLoop is a production-grade, role-based workflow management system designed specifically for internal IT operations. It enforces a strict, closed-loop lifecycle to ensure accountability, traceability, and verification of all technical tasks within an organization.

**Core Workflow:** `Task` $\to$ `Execution` $\to$ `Reporting` $\to$ `Review` $\to$ `Approval`

---

## 🎯 Purpose & Vision
WorkLoop solves the common operational failures of unstructured IT communication (verbal tasks, fragmented chats) by introducing a mandatory verification process. **A task is never considered complete until it is documented, reviewed, and approved by authority.**

### 🧠 The Loop Concept
1. **Admin** creates and assigns a task $\to$ **Pending**
2. **IT Officer** executes the work $\to$ **In Progress**
3. **IT Officer** submits a detailed technical report $\to$ **Submitted**
4. **Admin** reviews the report $\to$ **Approved** or **Rejected**

---

## 👥 User Roles & Permissions
- 🔴 **Admin (System Controller):** Full authority. Manages users, creates tasks, reviews reports, and grants final approvals.
- 🟢 **IT Officer (Task Owner):** Technical executor. Manages assigned tasks and submits detailed completion reports.
- 🟡 **Assistant (Support Role):** Field support. Provides physical assistance to IT Officers (non-managing role).

---

## 🎨 UI/UX Design Philosophy
The frontend is built as a **sellable SaaS product**, prioritizing a high-end, modern aesthetic without relying on external UI libraries.

- **Glassmorphism:** Heavy use of backdrop blurs, translucent panels, and soft neon glows.
- **Brand Identity:** The **Text Highlighter (Marker Style)** effect is used throughout the system to emphasize key values and statuses.
- **Custom Animation Engine:**
  - `BlurFade`: Staggered reveal transitions.
  - `NumberTicker`: Dynamic data counting.
  - `TypingAnimation` & `WordRotate`: Live system-feel headers.
  - `MagicCard`: Interactive spotlight hover effects.
  - `TerminalUI`: macOS-style system simulation.

---

## 🛠️ System Architecture

### 💻 Frontend (SaaS-Grade)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4.2 (Custom Configuration)
- **Routing:** React Router v7 (`createBrowserRouter` + Outlet system)
- **State Management:** Context API (Separated into `Auth`, `App`, and `Toast` contexts)
- **API Layer:** Native `fetch` implementation with a centralized request wrapper and JWT auto-attachment.

### 🔧 Backend (REST API)
- **Runtime:** Node.js + Express
- **Auth:** JWT-based Role-Based Access Control (RBAC)
- **Storage:** Local JSON file-based system (Architected for seamless MongoDB migration)

---

## 📁 Project Structure

```text
WorkLoop/
├── server/                 # Express Backend
│   ├── controllers/        # Business logic (Auth, Tasks, Users, Company)
│   ├── routes/             # API Endpoints
│   ├── middleware/         # Auth & Role protection
│   ├── data/               # Local JSON storage
│   └── index.js            # Entry point
└── client/                 # React Frontend
    ├── src/
    │   ├── api/            # Centralized Fetch wrapper (apiClient.js)
    │   ├── components/     # Modular UI System
    │   │   ├── animations/ # Custom motion components (BlurFade, MagicCard, etc.)
    │   │   ├── layout/      # Sidebar, Topbar, MainLayout
    │   │   └── ui/          # Base UI components (Button, ToastContainer)
    │   ├── context/        # Global State (Auth, App, Toast)
    │   ├── pages/          # Page-level views (Auth, Dashboard, Tasks, Users)
    │   ├── router/         # React Router v7 Configuration
    │   └── main.jsx        # Entry point
    ├── index.css           # Global styles & Custom Keyframes
    └── vite.config.js       # Vite & Tailwind configuration
```

---

## 🚀 Key Features
- **Strict Reporting:** Mandatory report fields (Problem, Steps Taken, Tools Used, Status).
- **Flexible Location System:** Tasks can be assigned to any custom location (Offices, Sheds, Floors, etc.).
- **Custom Toast System:** Queue-based, animated notifications built from scratch.
- **RBAC Security:** Routes and API endpoints are locked based on user roles.

## 📦 Future Roadmap
- [ ] Multi-company SaaS subscription model.
- [ ] Integration with MongoDB Atlas.
- [ ] Real-time Socket.io notifications.
- [ ] Advanced analytics dashboard for IT performance.
- [ ] Mobile application version.
