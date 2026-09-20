import React, { createContext, useContext, useState } from 'react';
export const DEMO_PERSONAS = [
    {
        key: 'kumar-owner',
        name: 'Kumar Store Owner',
        email: 'owner@kumarstores.in',
        role: 'TENANT_OWNER',
        roleLabel: 'Store Owner',
        tenantId: 'tenant-kumar-stores',
        tenantName: 'Kumar Stores',
        description: 'Full store management, catalog CRUD, and margins'
    },
    {
        key: 'kumar-manager',
        name: 'Suresh Manager',
        email: 'manager@kumarstores.in',
        role: 'MANAGER',
        roleLabel: 'Store Manager',
        tenantId: 'tenant-kumar-stores',
        tenantName: 'Kumar Stores',
        description: 'Catalog and stock adjustments, margins visible'
    },
    {
        key: 'kumar-staff',
        name: 'Staff Clerk',
        email: 'staff@kumarstores.in',
        role: 'STAFF',
        roleLabel: 'Store Staff',
        tenantId: 'tenant-kumar-stores',
        tenantName: 'Kumar Stores',
        description: 'Catalog lookup and counts, cost hidden'
    },
    {
        key: 'abc-owner',
        name: 'Rajesh Sharma',
        email: 'rajesh@abcsupermarket.in',
        role: 'TENANT_OWNER',
        roleLabel: 'Store Owner',
        tenantId: 'tenant-abc-supermarket',
        tenantName: 'ABC Supermarket',
        description: 'FMCG and grocery catalog management'
    },
    {
        key: 'abc-manager',
        name: 'Kavitha Ramasamy',
        email: 'kavitha.mgr@abcsupermarket.in',
        role: 'MANAGER',
        roleLabel: 'Store Manager',
        tenantId: 'tenant-abc-supermarket',
        tenantName: 'ABC Supermarket',
        description: 'Supermarket inventory, purchases, and reorders'
    },
    {
        key: 'city-retail-owner',
        name: 'K. Venkatesh',
        email: 'city@retail.com',
        role: 'TENANT_OWNER',
        roleLabel: 'Store Owner',
        tenantId: 'tenant-city-retail',
        tenantName: 'City Retail Hardware',
        description: 'Hardware, electrical, and tools retail'
    }
];
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    // Default to Kumar Stores Owner for direct operational view
    const defaultPersona = DEMO_PERSONAS[0];
    const [user, setUser] = useState({
        id: defaultPersona.key,
        name: defaultPersona.name,
        email: defaultPersona.email,
        role: defaultPersona.role,
        tenantId: defaultPersona.tenantId,
        tenantName: defaultPersona.tenantName
    });
    const login = (email, _pass) => {
        const emailNorm = email.trim().toLowerCase();
        const persona = DEMO_PERSONAS.find(p => p.email.toLowerCase() === emailNorm || (emailNorm === 'owner@abcsupermarket.com' && p.key === 'abc-owner'));
        if (persona) {
            setUser({
                id: persona.key,
                name: persona.name,
                email: persona.email,
                role: persona.role,
                tenantId: persona.tenantId,
                tenantName: persona.tenantName
            });
            return true;
        }
        return false;
    };
    const loginAsPersona = (personaKey) => {
        const persona = DEMO_PERSONAS.find(p => p.key === personaKey) || DEMO_PERSONAS[0];
        setUser({
            id: persona.key,
            name: persona.name,
            email: persona.email,
            role: persona.role,
            tenantId: persona.tenantId,
            tenantName: persona.tenantName
        });
    };
    const logout = () => {
        setUser(null);
    };
    const updateUserTenant = (tenantId, tenantName) => {
        if (user) {
            setUser({ ...user, tenantId, tenantName });
        }
    };
    return (<AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            loginAsPersona,
            logout,
            updateUserTenant
        }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
//# sourceMappingURL=AuthContext.js.map