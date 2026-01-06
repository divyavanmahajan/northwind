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
