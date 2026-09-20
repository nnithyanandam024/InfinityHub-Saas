export function canViewCosts(role) {
    if (!role)
        return false;
    return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'MANAGER';
}
export function canEditProducts(role) {
    if (!role)
        return false;
    return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'MANAGER';
}
export function canAdjustStock(role) {
    if (!role)
        return false;
    return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'MANAGER' || role === 'STAFF';
}
export function canManageSettings(role) {
    if (!role)
        return false;
    return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER';
}
export function isSuperAdmin(role) {
    return role === 'SUPER_ADMIN';
}
//# sourceMappingURL=permissions.js.map