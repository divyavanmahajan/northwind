export const UserRole = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    CUSTOMER: 'customer',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
    user_id: string;
    username: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login: string | null;
}

export interface UserListItem {
    user_id: string;
    username: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    last_login: string | null;
    created_at: string;
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UserUpdate {
    username?: string;
    email?: string;
    role?: UserRole;
    is_active?: boolean;
}

export interface PasswordReset {
    new_password: string;
}
