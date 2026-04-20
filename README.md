# WORKLOOP - Internal IT Task Management System

## Overview
Production-grade SaaS frontend built with React, Tailwind CSS, and Vite. Connects to existing Node.js/Express backend API.

## Features
- 🔐 Role-based authentication (Admin, IT Officer, Assistant)
- 📋 Task management with CRUD operations
- 👥 User management
- 🎨 Glassmorphism UI design with custom animations
- 🚀 Fetch API integration with backend
- ♿ Responsive mobile-first design

## Tech Stack
- React 19 + React Router 7
- Tailwind CSS
- Vite
- Context API (State Management)
- Fetch API (No Axios)

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend server running (default: http://localhost:5000)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp client/.env .env
# Edit .env file to match your backend URL
```

3. Start development server:
```bash
npm run dev
```

4. Access application:
- Open http://localhost:5173 (or your configured port)

## API Integration

### Environment Variables
- `VITE_API_URL`: Backend API base URL (default: http://localhost:5000)

### Backend Endpoints
- `POST /auth/login` - User authentication
- `GET /users/me` - Get current user info
- `GET /tasks` - List all tasks
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## Project Structure

```
src/
├── api/
│   └── client.js          # API client with fetch wrapper
├── context/
│   ├── AuthContext.jsx    # Authentication state
│   └── AppContext.jsx     # UI state management
├── router/
│   ├── RouterProvider.jsx # Router configuration
│   ├── AppRouter.jsx      # Route definitions
│   └── ProtectedRoute.jsx # Role-based protection
├── components/
│   ├── ui/               # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── MagicCard.jsx
│   │   ├── TextHighlighter.jsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   └── animations/       # Custom animations
├── pages/
│   ├── auth/
│   │   └── Login/
│   ├── dashboard/
│   ├── tasks/
│   │   ├── index.jsx     # Task list
│   │   └── [id].jsx      # Task detail
│   ├── users/
│   │   └── index.jsx
│   └── settings/
└── main.jsx              # App entry point
```

## UI Components

### Custom Components
- **TextHighlighter**: Brand highlight effect for headings
- **GradientText**: Gradient text styling
- **MagicCard**: Glassmorphism card with spotlight effect
- **Button**: Interactive buttons with hover effects
- **Input**: Form inputs with error states

### Design System
- Glassmorphism surfaces
- Smooth transitions and animations
- Consistent spacing system
- Responsive grid layouts

## Authentication Flow

1. User visits `/login`
2. Submits credentials (userId, password)
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. `/me` endpoint called to fetch user info
6. Role-based routing enforced
7. Session restored on page refresh

## Access Control

- **ADMIN**: Full access (dashboard, tasks, users, settings)
- **IT_OFFICER**: Dashboard and tasks only
- **ASSISTANT**: Dashboard and tasks only

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Best Practices
- All API calls use fetch API
- No mock data - connects directly to backend
- Role-based route protection
- Error handling in all async operations
- Clean component architecture

## Custom Animations

1. TextHighlighter - Hand-drawn marker effect
2. Animated Gradient Text - Gradient animation
3. Magic Card - Cursor spotlight glow
4. Blur Fade - Staggered reveal animations
5. Number Ticker - Animated counting

## Deployment

1. Build production bundle:
```bash
npm run build
```

2. Deploy static assets to hosting service
3. Configure backend CORS to allow frontend domain
4. Set environment variables for production

## Security Notes
- JWT tokens stored in localStorage
- Role validation on frontend AND backend
- Protected routes prevent unauthorized access
- API authentication via Bearer tokens

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Responsive design for mobile devices

## License
Proprietary - Internal Use Only