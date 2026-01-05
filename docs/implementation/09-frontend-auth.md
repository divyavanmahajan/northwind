# Prompt 09: Frontend Auth Store & Login Page

## Context
With the backend authentication complete, we now implement the frontend authentication flow including the Zustand auth store, login page, and API integration.

## Prerequisites
- Completed Prompt 08 (Auth Middleware & Protected Routes)
- Backend auth endpoints working
- Frontend scaffold ready

## Goals
1. Create auth store with Zustand
2. Build login page with form validation
3. Implement auth API service
4. Add token persistence
5. Handle auth state across app
6. Write tests for auth flow

---

## Prompt

```text
Implement frontend authentication with Zustand store, login page, and API integration.

AUTH TYPES (src/types/auth.ts):
Define authentication types:

```typescript
export interface User {
  user_id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'customer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

AUTH SERVICE (src/services/authService.ts):
Create authentication API service:

```typescript
import api from '@/lib/api';
import { LoginRequest, LoginResponse, User } from '@/types/auth';

const AUTH_BASE = '/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(`${AUTH_BASE}/login`, credentials);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>(`${AUTH_BASE}/me`);
    return response.data;
  },

  async getPermissions(): Promise<{ permissions: string[] }> {
    const response = await api.get<{ permissions: string[] }>(
      `${AUTH_BASE}/me/permissions`
    );
    return response.data;
  },

  logout(): void {
    // Client-side logout - clear token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
```

AUTH STORE (src/store/authStore.ts):
Create Zustand store for authentication:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/auth';
import { authService } from '@/services/authService';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ username, password });
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = 
            `Bearer ${response.access_token}`;
          
          // Fetch permissions
          const permData = await authService.getPermissions();
          
          set({
            user: response.user,
            token: response.access_token,
            permissions: permData.permissions,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = error.response?.data?.detail || 
                         error.message || 
                         'Login failed';
          set({
            user: null,
            token: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          permissions: [],
          isAuthenticated: false,
          error: null,
        });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const user = await authService.getMe();
          const permData = await authService.getPermissions();
          set({ user, permissions: permData.permissions, isAuthenticated: true });
        } catch {
          // Token invalid, logout
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

LOGIN FORM SCHEMA (src/schemas/auth.ts):
Create Zod validation schemas:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

LOGIN PAGE (src/pages/Login.tsx):
Create the login page:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, LoginFormData } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.username, data.password);
      navigate(from, { replace: true });
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Northwind
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register('username')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo accounts:</p>
            <p>admin / Admin123!</p>
            <p>manager / Manager123!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

AUTH HOOK (src/hooks/useAuth.ts):
Create convenience hook for auth:

```typescript
import { useAuthStore } from '@/store/authStore';
import { useCallback, useMemo } from 'react';

export function useAuth() {
  const store = useAuthStore();
  
  const hasPermission = useCallback((permission: string) => {
    return store.permissions.includes(permission);
  }, [store.permissions]);
  
  const hasRole = useCallback((roles: string | string[]) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return store.user ? roleArray.includes(store.user.role) : false;
  }, [store.user]);
  
  const isAdmin = useMemo(() => store.user?.role === 'admin', [store.user]);
  const isManager = useMemo(() => 
    ['admin', 'manager'].includes(store.user?.role || ''), [store.user]);
  
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    permissions: store.permissions,
    login: store.login,
    logout: store.logout,
    refreshUser: store.refreshUser,
    hasPermission,
    hasRole,
    isAdmin,
    isManager,
  };
}
```

INITIALIZE AUTH ON APP LOAD (src/App.tsx):
Update App to restore auth state:

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function App() {
  const { token, refreshUser } = useAuthStore();
  
  useEffect(() => {
    // Restore auth state on app load
    if (token) {
      refreshUser();
    }
  }, []);
  
  // ... rest of app
}
```

UPDATE API CLIENT (src/lib/api.ts):
Add auth token from store on initialization:

```typescript
import { useAuthStore } from '@/store/authStore';

// Set initial token if exists
const token = useAuthStore.getState().token;
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Update interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

TESTS (src/__tests__/auth/):

1. authStore.test.ts:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should start with no user', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should clear error on clearError', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      useAuthStore.setState({ error: 'Some error' });
    });
    expect(result.current.error).toBe('Some error');
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
```

2. Login.test.tsx:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '@/pages/Login';

describe('Login Page', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });
});
```

VERIFICATION:
1. docker-compose up -d --build
2. Visit http://localhost:5173/login
3. Test login with invalid credentials (should show error)
4. Test login with valid credentials (should redirect to dashboard)
5. Refresh page (should stay logged in)
6. Click logout (should redirect to login)
7. Run tests: cd frontend && npm test

SUCCESS CRITERIA:
- Auth store persists token to localStorage
- Login form validates input
- Successful login redirects to dashboard
- Failed login shows error message
- Page refresh maintains auth state
- Logout clears auth state
- All tests pass
```

---

## Verification Checklist

- [ ] Auth types defined correctly
- [ ] Auth service makes API calls
- [ ] Auth store manages state with persistence
- [ ] Login form validates with Zod
- [ ] Login page renders correctly
- [ ] Successful login works
- [ ] Error messages display
- [ ] useAuth hook provides convenience methods
- [ ] App restores auth on load
- [ ] All tests pass

---

## Next Step
Proceed to [Prompt 10: Protected Routes & Role-Based UI](./10-protected-routes.md)
