# Prompt 04: React + Vite Frontend Scaffold

## Context
With the backend API running, we now create the React frontend application using Vite, TypeScript, and Tailwind CSS. This establishes the foundation for all UI development.

## Prerequisites
- Completed Prompt 03 (FastAPI Base)
- Backend API accessible at http://localhost:8000

## Goals
1. Initialize Vite + React + TypeScript project
2. Configure Tailwind CSS
3. Set up shadcn/ui
4. Create basic routing structure
5. Configure TanStack Query
6. Set up Zustand store pattern
7. Create API client configuration

---

## Prompt

```text
Create the React frontend application scaffold with Vite, TypeScript, Tailwind CSS, and essential libraries.

PROJECT INITIALIZATION:
In the frontend/ directory, initialize a new Vite project:
1. Use: npm create vite@latest . -- --template react-ts
2. Install dependencies: npm install

INSTALL ADDITIONAL DEPENDENCIES:
Production dependencies:
- @tanstack/react-query
- react-router-dom
- zustand
- react-hook-form
- @hookform/resolvers
- zod
- axios
- clsx
- tailwind-merge
- lucide-react
- chart.js
- react-chartjs-2
- date-fns

Dev dependencies:
- @types/node
- autoprefixer
- postcss
- tailwindcss
- vitest
- @testing-library/react
- @testing-library/jest-dom
- jsdom

TAILWIND CSS SETUP:
1. Initialize: npx tailwindcss init -p
2. Configure tailwind.config.js for:
   - Content paths: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
   - Dark mode: 'class'
   - Custom colors for Northwind branding
3. Create src/index.css with Tailwind directives and CSS variables for theming

SHADCN/UI SETUP:
1. Initialize shadcn: npx shadcn@latest init
2. Choose: TypeScript, Default style, CSS variables
3. Add initial components: npx shadcn@latest add button card input label

PROJECT STRUCTURE:
Organize src/ as:
```
src/
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── common/
│       └── LoadingSpinner.tsx
├── hooks/
│   └── useApi.ts
├── lib/
│   ├── api.ts            # Axios instance
│   ├── queryClient.ts    # TanStack Query config
│   └── utils.ts          # Utility functions (cn helper)
├── pages/
│   ├── Dashboard.tsx     # Placeholder
│   ├── Login.tsx         # Placeholder
│   └── NotFound.tsx
├── services/
│   └── healthService.ts  # First API service
├── store/
│   └── uiStore.ts        # UI state (sidebar, theme)
├── types/
│   ├── api.ts            # API response types
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

API CLIENT (src/lib/api.ts):
Create Axios instance with:
1. baseURL from VITE_API_URL environment variable
2. Default headers for JSON
3. Request interceptor to add auth token (placeholder for now)
4. Response interceptor for error handling

TANSTACK QUERY CONFIG (src/lib/queryClient.ts):
Create and configure QueryClient with:
1. Default stale time: 5 minutes
2. Retry: 1 attempt
3. Refetch on window focus: true

UI STORE (src/store/uiStore.ts):
Create Zustand store for UI state:
1. sidebarOpen: boolean
2. theme: 'light' | 'dark'
3. toggleSidebar()
4. setTheme(theme)

LAYOUT COMPONENTS:
Create basic layout structure:

1. Header.tsx - Top navigation bar with:
   - App title "Northwind"
   - Theme toggle button
   - Placeholder for user menu

2. Sidebar.tsx - Side navigation with:
   - Navigation links (Dashboard, Products, Orders, etc.)
   - Collapsible functionality
   - Active route highlighting

3. Layout.tsx - Main layout wrapper:
   - Uses Header and Sidebar
   - Main content area with outlet
   - Responsive design

ROUTING (src/App.tsx):
Set up React Router with:
1. Layout wrapper route
2. /dashboard - Dashboard page
3. /login - Login page
4. /* - NotFound page
5. Redirect / to /dashboard

PAGES:
Create placeholder pages:

1. Dashboard.tsx:
   - Title "Dashboard"
   - Card showing API health status (fetch from /api/v1/health)
   - Use TanStack Query for data fetching

2. Login.tsx:
   - Placeholder login form
   - Will be implemented fully later

3. NotFound.tsx:
   - 404 message
   - Link back to dashboard

HEALTH SERVICE (src/services/healthService.ts):
Create service with:
1. getHealth() - GET /api/v1/health
2. getHealthReady() - GET /api/v1/health/ready

ENVIRONMENT FILES:
Create .env.development:
- VITE_API_URL=http://localhost:8000/api/v1

Create .env.example:
- VITE_API_URL=http://localhost:8000/api/v1

DOCKERFILE UPDATE:
Update frontend/Dockerfile for development:
- Use node:20-alpine
- Copy package*.json and install
- Copy source
- Run npm run dev with host 0.0.0.0

VITE CONFIG:
Update vite.config.ts:
1. Add proxy for /api to backend (optional, for non-Docker dev)
2. Configure host: true for Docker
3. Set up path aliases (@/ for src/)

TESTS:
Create src/__tests__/App.test.tsx:
1. Test that App renders without crashing
2. Test that NotFound page renders for unknown routes

VERIFICATION:
1. docker-compose up -d --build frontend
2. Visit http://localhost:5173
3. Should see layout with sidebar and header
4. Dashboard should show API health status
5. Navigation should work

SUCCESS CRITERIA:
- Frontend starts without errors
- Layout renders correctly
- API call to health endpoint works
- Theme toggle works
- Sidebar toggle works
- Routes navigate correctly
- shadcn/ui components render properly
```

---

## Key Code Patterns

### Axios Instance (src/lib/api.ts)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### UI Store (src/store/uiStore.ts)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-store' }
  )
);
```

---

## Verification Checklist

- [ ] Vite project initialized with React + TypeScript
- [ ] Tailwind CSS configured and working
- [ ] shadcn/ui installed with base components
- [ ] Project structure organized correctly
- [ ] API client configured
- [ ] TanStack Query set up
- [ ] Zustand store working
- [ ] Layout components render
- [ ] Routing works correctly
- [ ] Health API call succeeds
- [ ] Docker container runs frontend

---

## Next Step
Proceed to [Prompt 05: Frontend-Backend Integration & CORS](./05-integration.md)
