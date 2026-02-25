# ForaTask PRD - Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS task management application called **ForaTask**. Key requirements:
1. SaaS model with Razorpay, subscriptions, access control
2. Recurring tasks with completion history
3. Master Admin panel for platform management
4. Marketing website (Next.js)
5. Chat module (real-time DM + group)
6. Attendance module with geotag
7. Task enhancements: multi-location (max 7), remote flag, timeline, discussions
8. Viewer approval flow
9. Admin-Employee analytics
10. Salary & Leave module
11. Seed data: Varient Worldwide (Rajvi/Admin, Shubh/Supervisor, Tushar/Employee)

## UI Requirements
- Light theme
- Primary: #1360C6, Secondary: #103362
- 75% and 50% opacity variants of #1360C6 for supporting elements
- Clean, modern, minimal interface

## Multi-Location Task UX
- Increment/decrement control labeled "Add Location"
- Auto-generate fields as count increases (Location 1, 2, 3... max 7)
- Each with: name input (default "Location N"), description input
- Both doer and viewer can edit name & description, increase/decrease locations
- Doer updates: progress, geotag, remarks, completion status

## Architecture
```
/app/
├── backend/              # FastAPI reverse proxy (port 8001 → Node.js port 3333)
│   └── server.py
├── frontend/             # React web app (port 3000)
│   └── src/
│       ├── pages/        # Login, Register, Dashboard, TaskList, TaskCreate, TaskDetail, Chat, Attendance, Team
│       ├── components/   # Layout
│       ├── AuthContext.js
│       ├── api.js
│       └── utils.js
├── foratask-backend/     # Node.js/Express backend (runs on port 3333)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed.js
│   └── server.js
├── foratask-frontend/    # React Native (Expo) mobile app
├── foratask-admin/       # Vite React admin panel
├── foratask-marketing/   # Next.js marketing site
└── memory/
```

## Tech Stack
- Backend: Node.js, Express, Mongoose, Socket.io
- Frontend: React (CRA), TailwindCSS, React Router v6
- Database: MongoDB (localhost:27017/foratask)
- Payments: Razorpay
- Proxy: FastAPI (uvicorn) reverse proxying to Node.js

## Key API Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (company + admin user)
- `GET /api/me/userinfo` - Current user info
- `GET /api/me/usersList` - Team members list
- `POST /api/task/add-task` - Create task (returns taskId)
- `GET /api/task/getTaskList` - List tasks (params: isSelfTask, perPage, page)
- `GET /api/task/:id` - Get task detail
- `PATCH /api/task/edit/:id` - Edit task
- `PATCH /api/task/markAsCompleted` - Complete tasks
- `GET /api/stats/tasks-summary` - Dashboard statistics
- `GET /api/emp-list` - Employee list (admin only)
- `POST /api/add-employee` - Add team member (admin only)
- `POST /api/attendance/check-in` - Check in with geotag
- `POST /api/attendance/check-out` - Check out with geotag
- `GET /api/attendance/today` - Today's attendance status
- `GET /api/attendance/history` - Attendance history
- `GET /api/chat/rooms` - Chat rooms
- `POST /api/chat/dm` - Create/get DM
- `GET /api/chat/rooms/:id/messages` - Get messages
- `POST /api/chat/rooms/:id/messages` - Send message
- `POST /api/task-extended/:id/locations` - Add locations
- `GET /api/task-extended/:id/locations` - Get locations
- `PATCH /api/task-extended/:id/locations/:locId/progress` - Update location progress
- `GET /api/task-extended/:id/discussions` - Get discussions
- `POST /api/task-extended/:id/discussions` - Add comment
- `GET /api/task-extended/:id/timeline` - Get timeline

## Credentials
- Admin: rajvi@varientworld.com / Rajvi@123
- Supervisor: shubh@varientworld.com / Shubh@123
- Employee: developers1@varientworld.com / Tushar@123
- Master Admin: admin@foratask.com / Varient23@123

## What's Been Implemented (Feb 25, 2026)

### Phase 1 (Previous Agent)
- SaaS model with Razorpay integration
- Recurring tasks with completion history
- Master Admin panel (foratask-admin)
- Marketing website (foratask-marketing)
- All Node.js backend controllers & models

### Phase 2 (Current Session - Feb 25, 2026)
- FastAPI reverse proxy setup (backend/server.py → Node.js)
- React web frontend at /app/frontend with all core pages
- Login & Registration with JWT auth
- Dashboard with stats (total, in-progress, completed, overdue) + recent tasks
- Task list with filters (Team/Self, status, search, pagination)
- Task creation with multi-location increment/decrement UI (max 7 locations)
- Task detail page with 4 tabs: Details, Locations, Timeline, Discussion
- Chat module: DM creation, message sending/receiving, room list
- Attendance: Check-in/out with geolocation, today's status, history
- Team management: Member list, add member (admin)
- Sidebar navigation with responsive design
- Seed data: Varient Worldwide company with 3 users
- Bug fixes: task creation returns taskId, chat sendMessage uses params, discussion notification type

## Pending / Backlog

### P0 - Critical
- None (core functionality working)

### P1 - High Priority
- Salary & Leave module (frontend + backend logic)
- Admin-Employee analytics dashboard
- Task edit functionality in frontend
- Viewer approval flow for tasks/locations

### P2 - Medium Priority
- Group chat creation UI
- File/image sharing in chat
- Location geotag submission for location progress
- Attendance admin settings UI
- Task recurring schedule management

### P3 - Low Priority
- Master Admin panel integration with new preview URL
- Marketing website integration
- Mobile app (React Native) connectivity
- Push notifications via Expo
- Advanced reporting & exports

---
*Last Updated: February 25, 2026*
