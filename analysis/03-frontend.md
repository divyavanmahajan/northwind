# Frontend Architecture

## Entry Point

`frontend/src/main.tsx` — Mounts React app, wraps with `QueryClientProvider` (TanStack Query), `BrowserRouter`, and theme provider.

`frontend/src/App.tsx` — Top-level routing: public routes (`/login`) vs. protected routes (all others). Protected routes check `authStore` for a valid session.

## Directory Structure

```
frontend/src/
├── components/
│   ├── auth/        # Auth guards, login form
│   ├── common/      # Shared utility components (pagination, search, etc.)
│   ├── features/    # Domain-specific components (product card, order table, etc.)
│   ├── layout/      # App shell: sidebar, header, main layout wrapper
│   └── ui/          # Low-level UI primitives (built on Radix UI)
├── hooks/           # Custom hooks (one per API resource)
├── lib/             # Utilities: cn(), axios instance (lib/api.ts)
├── pages/           # Route-level page components
├── schemas/         # Zod validation schemas (mirror backend validation)
├── services/        # API call functions (one file per resource)
├── store/           # Zustand global state
├── stories/         # Storybook component stories
├── types/           # TypeScript interfaces / types
└── __tests__/       # Unit test files
```

## Pages (`src/pages/`)

Each major module has dedicated pages:

| Page | Route | Description |
|------|-------|-------------|
| `Login.tsx` | `/login` | Authentication form |
| `Dashboard.tsx` | `/` | KPIs, charts, recent orders |
| `Categories.tsx` | `/categories` | Category list |
| `Suppliers.tsx` | `/suppliers` | Supplier list |
| `SupplierDetail.tsx` | `/suppliers/:id` | Supplier detail view |
| `SupplierFormPage.tsx` | `/suppliers/new`, `/suppliers/:id/edit` | Create/edit supplier |
| `Products.tsx` | `/products` | Product list with filtering |
| `ProductDetail.tsx` | `/products/:id` | Product detail view |
| `ProductFormPage.tsx` | `/products/new`, `/products/:id/edit` | Create/edit product |
| `Customers.tsx` | `/customers` | Customer list |
| `CustomerDetail.tsx` | `/customers/:id` | Customer detail |
| `CustomerFormPage.tsx` | `/customers/new`, `/customers/:id/edit` | Create/edit customer |
| `Employees.tsx` | `/employees` | Employee list |
| `EmployeeDetail.tsx` | `/employees/:id` | Employee detail |
| `EmployeeFormPage.tsx` | `/employees/new`, `/employees/:id/edit` | Create/edit employee |
| `Orders.tsx` | `/orders` | Order list with status filter |
| `OrderDetail.tsx` | `/orders/:id` | Order detail with line items |
| `OrderFormPage.tsx` | `/orders/new`, `/orders/:id/edit` | Create/edit order |
| `Users.tsx` | `/users` | User management (admin only) |
| `NotFound.tsx` | `*` | 404 page |

## Services (`src/services/`)

Pure functions that call the backend API using the shared Axios instance (`src/lib/api.ts`). Each service file corresponds to one resource:

```ts
// Example pattern
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};
```

The axios instance automatically attaches the `Authorization: Bearer <token>` header from the auth store and handles 401 responses (triggers logout).

## Hooks (`src/hooks/`)

Custom hooks wrap TanStack Query (`useQuery`, `useMutation`) around the service functions. One hook file per resource:

```ts
// Pattern
export function useProducts(params) {
  return useQuery(['products', params], () => productService.getAll(params));
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation(productService.create, {
    onSuccess: () => queryClient.invalidateQueries(['products']),
  });
}
```

`useApi.ts` — Generic base hook for common query patterns.
`useAuth.ts` — Auth-specific actions: login, logout, current user.

## State Management (`src/store/`)

| Store | Contents |
|-------|---------|
| `authStore.ts` | `user`, `token`, `isAuthenticated`; `login()`, `logout()` actions |
| `uiStore.ts` | Global UI state: sidebar open/closed, loading states |

Zustand stores persist auth state to `localStorage`.

## Schemas (`src/schemas/`)

Zod schemas validate form input before submission. They mirror the backend validation rules and are used with `react-hook-form` + `@hookform/resolvers/zod`.

## Components

### `components/ui/`
Low-level primitives wrapping **Radix UI** components: `Button`, `Input`, `Select`, `Dialog`, `Table`, `Badge`, `Card`, `Tabs`, `Avatar`, `DropdownMenu`, `AlertDialog`, `Label`, `Checkbox`.

Styled with **Tailwind CSS** using the `cn()` utility (from `clsx` + `tailwind-merge`).

### `components/layout/`
- `AppLayout.tsx` — Main authenticated shell (sidebar + header + content area)
- `Sidebar.tsx` — Navigation sidebar with role-based menu items
- `Header.tsx` — Top bar with user avatar and logout

### `components/features/`
Domain-specific components: data tables, form sections, stat cards, chart wrappers.

### `components/common/`
Reusable utility components: `Pagination`, `SearchInput`, `StatusBadge`, `ConfirmDialog`, `LoadingSpinner`, `EmptyState`.

## Routing

React Router v7 with nested routes. Auth guard checks `authStore.isAuthenticated`; unauthenticated users are redirected to `/login`.

Role-based UI hiding is handled in components by reading `authStore.user.role`.

## Testing

### Unit Tests (Vitest)
```bash
cd frontend
npm run test           # run all unit tests
npm run test -- --coverage  # with coverage
```

Test files co-located at `src/__tests__/` or alongside components.

### E2E Tests (Playwright)
```bash
cd frontend
npm run test:e2e           # headless
npm run test:e2e:ui        # Playwright UI mode
npm run test:e2e:headed    # headed browser
npm run test:e2e:debug     # debug mode
```

E2E test files are in `frontend/e2e/` (or project-root `playwright.config.ts`).

Target: **70% frontend coverage**.

## Storybook

```bash
cd frontend
npm run storybook       # dev server at :6007
npm run build-storybook # static build
```

Stories live in `src/stories/`.

## Code Quality

```bash
cd frontend
npm run lint          # ESLint (flat config)
npm run type-check    # tsc --noEmit
npm run format        # Prettier (if configured)
npm run build         # Production build (catches type errors)
```

## Key Conventions

- **Functional components only** — no class components
- **Named exports** for all components
- **TypeScript interfaces** defined in `src/types/` or co-located
- **Zod schemas** for all form validation
- **TanStack Query** for all server state; Zustand only for client-only state
- Component files use **PascalCase** (e.g. `ProductDetail.tsx`)
- Hook files use **camelCase** prefixed with `use` (e.g. `useProducts.ts`)
- Service files use **camelCase** with `Service` suffix (e.g. `productService.ts`)
