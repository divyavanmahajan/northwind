# Prompt 05: Frontend-Backend Integration & CORS

## Context
With both frontend and backend running, we now ensure they communicate properly through proper CORS configuration, API error handling, and integration testing.

## Prerequisites
- Completed Prompt 04 (Frontend Scaffold)
- Both containers running

## Goals
1. Verify CORS configuration works correctly
2. Implement comprehensive API error handling
3. Create TypeScript types for API responses
4. Build reusable data fetching hooks
5. Add loading and error states to components
6. Write integration tests

---

## Prompt

```text
Complete the frontend-backend integration with proper error handling, type safety, and testing.

API TYPES (src/types/api.ts):
Create TypeScript types matching backend schemas:

```typescript
// Pagination
interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  filters_applied?: Record<string, any>;
  sort_applied?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

// Error
interface ErrorDetail {
  field?: string;
  message: string;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    timestamp: string;
    path: string;
  };
}

// Health
interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}

interface HealthReadyResponse {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latency_ms: number;
    };
  };
}
```

ENHANCED API CLIENT (src/lib/api.ts):
Update the Axios instance with:

1. Better error transformation:
   - Convert Axios errors to consistent format
   - Extract error messages from response
   - Handle network errors gracefully

2. Create typed request functions:
   - get<T>(url, config) - typed GET
   - post<T>(url, data, config) - typed POST
   - put<T>(url, data, config) - typed PUT
   - delete<T>(url, config) - typed DELETE

3. Add error type guard:
   - isApiError(error): error is ApiError

REACT QUERY HOOKS (src/hooks/):
Create reusable query hooks:

1. src/hooks/useHealth.ts:
```typescript
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthService.getHealth(),
    staleTime: 30000,
  });
}

export function useHealthReady() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: () => healthService.getHealthReady(),
    staleTime: 30000,
  });
}
```

2. src/hooks/useApi.ts - Generic API hook factory:
```typescript
export function createQueryHook<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return () => useQuery({ queryKey: key, queryFn: fetcher, ...options });
}
```

ERROR BOUNDARY COMPONENT (src/components/common/ErrorBoundary.tsx):
Create React error boundary that:
1. Catches rendering errors
2. Displays user-friendly error message
3. Provides "retry" button
4. Logs errors for debugging

LOADING COMPONENTS (src/components/common/):
1. LoadingSpinner.tsx - Animated spinner
2. LoadingOverlay.tsx - Full page loading overlay
3. Skeleton.tsx - Content skeleton loaders

ERROR DISPLAY COMPONENTS:
1. ErrorMessage.tsx - Inline error display
2. ErrorCard.tsx - Card with error details
3. ApiErrorDisplay.tsx - Formatted API error display

UPDATE DASHBOARD PAGE:
Enhance Dashboard.tsx to:
1. Show loading spinner while fetching health
2. Display error message if health check fails
3. Show database latency from ready endpoint
4. Auto-refresh every 30 seconds
5. Add manual refresh button

TOAST NOTIFICATIONS:
Install and configure sonner or react-hot-toast:
1. Add ToastProvider in App.tsx
2. Create useToast hook for showing notifications
3. Show toast on API errors
4. Show success toast on actions

INTEGRATION TESTS:
Create src/__tests__/integration/:

1. api.test.ts - Test API client:
   - Mock axios responses
   - Test error handling
   - Test auth token injection

2. Dashboard.test.tsx - Test Dashboard integration:
   - Mock API responses
   - Test loading state renders
   - Test error state renders
   - Test successful data display

E2E PREPARATION:
Create e2e/ directory structure:
```
frontend/e2e/
├── fixtures/
│   └── health.json
├── support/
│   └── commands.ts
└── health.spec.ts
```

Create health.spec.ts (placeholder for Playwright):
```typescript
// Will be implemented in Phase 6
test.describe('Health Check', () => {
  test('shows health status on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('healthy')).toBeVisible();
  });
});
```

VERIFICATION SCRIPT:
Create scripts/verify-integration.sh:
```bash
#!/bin/bash
# Verify frontend-backend integration

echo "Checking backend health..."
curl -s http://localhost:8000/api/v1/health | jq .

echo "Checking CORS headers..."
curl -s -I -X OPTIONS http://localhost:8000/api/v1/health \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

echo "Checking frontend..."
curl -s http://localhost:5173 | head -20

echo "Running frontend tests..."
cd frontend && npm test -- --run
```

DOCKER COMPOSE UPDATE:
Add healthcheck to frontend service:
```yaml
frontend:
  # ... existing config
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5173"]
    interval: 30s
    timeout: 10s
    retries: 3
```

SUCCESS CRITERIA:
- CORS works correctly (no browser console errors)
- API types match backend responses
- Loading states display properly
- Error states display properly
- Toast notifications appear on errors
- Health data displays on dashboard
- All unit and integration tests pass
- Both services healthy in Docker
```

---

## Verification Checklist

- [ ] API types defined and match backend
- [ ] Enhanced API client with error handling
- [ ] React Query hooks working
- [ ] Error boundary catches errors
- [ ] Loading components render
- [ ] Dashboard shows health status
- [ ] Toast notifications work
- [ ] CORS configured correctly
- [ ] Integration tests pass
- [ ] Docker healthchecks pass

---

## Next Step
Proceed to [Prompt 06: User Model & Password Security](./06-user-model.md)

This completes **Phase 1: Foundation & Infrastructure**. The application now has:
- Docker-based development environment
- PostgreSQL database with SQLAlchemy
- FastAPI backend with health endpoints
- React frontend with Vite and Tailwind
- Full frontend-backend integration
