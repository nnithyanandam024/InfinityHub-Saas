import React from 'react';
import { Role } from '@infinityhub/types';
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    tenantId: string;
    tenantName: string;
}
export interface DemoPersona {
    key: string;
    name: string;
    email: string;
    role: Role;
    roleLabel: string;
    tenantId: string;
    tenantName: string;
    description: string;
}
export declare const DEMO_PERSONAS: DemoPersona[];
interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (email: string, pass: string) => boolean;
    loginAsPersona: (personaKey: string) => void;
    logout: () => void;
    updateUserTenant: (tenantId: string, tenantName: string) => void;
}
export declare const AuthProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useAuth: () => AuthContextType;
export {};
//# sourceMappingURL=AuthContext.d.ts.map