# ForaTask PRD - Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS task management application called **ForaTask**.

## UI Requirements
- Light theme
- Primary: #1360C6, Secondary: #103362
- 75% and 50% opacity variants of #1360C6
- Clean, modern, minimal interface
- Fully responsive: desktop, tablet, Android, iOS

## Architecture
```
/app/
├── backend/              # FastAPI reverse proxy (port 8001 → Node.js 3333)
│   └── server.py
├── frontend/             # React web app (port 3000)
│   └── src/
│       ├── pages/        # Login, Register, Dashboard, TaskList, TaskCreate,
│       │                 # TaskDetail, Chat, Attendance, Employees,
│       │                 # EmployeeProfile, Reports, Settings
│       ├── components/   # Layout (sidebar + topbar)
│       ├── AuthContext.js
│       ├── api.js
│       └── utils.js
├── foratask-backend/     # Node.js/Express (port 3333 via nodemon)
├── foratask-admin/       # Vite React admin panel
├── foratask-marketing/   # Next.js marketing site
└── memory/
```

## Credentials
- Admin: rajvi@varientworld.com / Rajvi@123
- Supervisor: shubh@varientworld.com / Shubh@123
- Employee: developers1@varientworld.com / Tushar@123
- Master Admin: admin@foratask.com / Varient23@123

## Implemented Features

### Phase 1 (Previous Agent)
- SaaS model with Razorpay, subscriptions, access control
- Recurring tasks with completion history
- Master Admin panel, Marketing website
- All Node.js backend controllers & models

### Phase 2 (Feb 25, 2026 - Session 1)
- FastAPI proxy, React web frontend, seed data
- Auth (login/register), Dashboard, Tasks CRUD
- Chat, Attendance, Team management
- Multi-location task creation (increment/decrement, max 7)

### Phase 3 (Feb 25, 2026 - Session 2: UI Overhaul)
- Dashboard: stats cards, Today's Task table, Task Summary donut, Statistics line chart, Calendar widget, Recent Activity, Notes, Priority Queue, Task Overview table
- Sidebar: Dashboard, Task, Discussion, Reports, Employees, Settings
- Top bar: search, notification bell, user avatar
- Employees page: blue header table (Name, Designation, Email, Contact, Type)
- Employee Profile page: Overview/Attendance/Salary tabs, monthly trends chart, working days bar, daily attendance log with geotag
- Task list: blue header table with doer avatars
- Task detail: Details/Locations/Discussion tabs, doer/viewer chips
- Reports page: pie + bar charts
- Settings page: profile, org settings
- Full mobile responsiveness (390px+)

## Pending / Backlog

### P1 - High Priority
- Salary & Leave module (backend logic + frontend)
- Admin-Employee analytics dashboard
- Task edit functionality
- Viewer approval flow for tasks/locations

### P2 - Medium Priority
- Group chat creation UI + file sharing
- Location geotag for progress updates
- Attendance admin settings UI
- Task recurring schedule management

### P3 - Low Priority
- Master Admin panel integration
- Marketing website integration
- Mobile React Native app connectivity
- Push notifications, reporting exports

---
*Last Updated: February 25, 2026*
