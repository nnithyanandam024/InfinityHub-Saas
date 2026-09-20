import { mockStore } from '../apps/web/src/data/mockStore';
import { authService } from '../apps/web/src/services/authService';
import { userService } from '../apps/web/src/services/userService';
import { tenantService } from '../apps/web/src/services/tenantService';
let testsPassed = 0;
let testsFailed = 0;
function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        testsPassed++;
    }
    else {
        console.error(`  ❌ FAIL: ${testName}`);
        testsFailed++;
    }
}
async function runTests() {
    console.log('====================================================');
    console.log('🧪 VERIFYING PASSWORD SECURITY & LIFECYCLE FLOWS');
    console.log('====================================================\n');
    // Test Suite 1: Login Verification
    console.log('1. Password Verification at Login:');
    try {
        // Correct password for ABC Supermarket Owner
        const user1 = await authService.login('rajesh@abcsupermarket.in', 'password123');
        assert(user1.id === 'usr-abc-owner', 'Correct password successfully authenticates tenant owner');
    }
    catch (err) {
        assert(false, `Expected successful login, got: ${err.message}`);
    }
    try {
        // Incorrect password for ABC Supermarket Owner
        await authService.login('rajesh@abcsupermarket.in', 'wrongPassword!');
        assert(false, 'Expected failure on incorrect password');
    }
    catch (err) {
        assert(err.message === 'Invalid email or password', 'Incorrect password correctly rejected with error');
    }
    try {
        // Super Admin correct password
        const admin = await authService.login('admin@infinityhub.io', 'password123');
        assert(admin.role === 'SUPER_ADMIN', 'Correct password authenticates Super Admin');
    }
    catch (err) {
        assert(false, `Expected Super Admin login success, got: ${err.message}`);
    }
    try {
        // Super Admin incorrect password
        await authService.login('admin@infinityhub.io', 'incorrectSuperAdminPass');
        assert(false, 'Expected failure on incorrect Super Admin password');
    }
    catch (err) {
        assert(err.message === 'Invalid email or password', 'Incorrect Super Admin password rejected');
    }
    // Test Suite 2: Password Reset Flow (Forgot Password)
    console.log('\n2. Password Reset by Email (Forgot Password Flow):');
    try {
        // Reset password for Suresh Kumar
        await authService.resetPassword('suresh@kumarstores.com', 'KumarNewPass2026!');
        assert(true, 'resetPassword completed without error');
        // Attempt login with old password (should fail)
        let oldFailed = false;
        try {
            await authService.login('suresh@kumarstores.com', 'password123');
        }
        catch {
            oldFailed = true;
        }
        assert(oldFailed, 'Old password no longer valid after reset');
        // Attempt login with new password (should succeed)
        const kumarUser = await authService.login('suresh@kumarstores.com', 'KumarNewPass2026!');
        assert(kumarUser.name === 'Suresh Kumar', 'Login succeeds with new reset password');
    }
    catch (err) {
        assert(false, `Password reset flow error: ${err.message}`);
    }
    try {
        // Reset password on invalid email
        let errorCaught = false;
        try {
            await authService.resetPassword('nonexistent@user.com', 'SomeNewPass123!');
        }
        catch {
            errorCaught = true;
        }
        assert(errorCaught, 'Resetting password for nonexistent account rejected');
    }
    catch (err) {
        assert(false, `Nonexistent user reset error: ${err.message}`);
    }
    try {
        // Reset with too short password
        let shortPassRejected = false;
        try {
            await authService.resetPassword('suresh@kumarstores.com', '123');
        }
        catch {
            shortPassRejected = true;
        }
        assert(shortPassRejected, 'Password under 6 characters rejected by reset function');
    }
    catch (err) {
        assert(false, `Short pass error: ${err.message}`);
    }
    // Test Suite 3: In-App Change Password
    console.log('\n3. In-App Password Change:');
    try {
        const abcOwner = mockStore.getTenantUsers('tenant-abc-supermarket')[0];
        // Attempt change password with WRONG current password
        let wrongCurrentFailed = false;
        try {
            await authService.changePassword(abcOwner.id, 'incorrectCurrent', 'BrandNewSecret99!');
        }
        catch {
            wrongCurrentFailed = true;
        }
        assert(wrongCurrentFailed, 'changePassword fails when current password does not match');
        // Change password with CORRECT current password
        await authService.changePassword(abcOwner.id, 'password123', 'BrandNewSecret99!');
        assert(true, 'changePassword succeeds with valid current password');
        // Verify login with new password
        const updatedOwner = await authService.login('rajesh@abcsupermarket.in', 'BrandNewSecret99!');
        assert(updatedOwner.id === abcOwner.id, 'Owner successfully authenticates with updated password');
    }
    catch (err) {
        assert(false, `In-app change password error: ${err.message}`);
    }
    // Test Suite 4: Invite Team Member with Password
    console.log('\n4. User Creation & Invite with Password:');
    try {
        const testEmail = `invited.member.${Date.now()}@abcsupermarket.in`;
        const customPassword = 'InvitedMember@2026!';
        const invitedUser = await userService.inviteUser('tenant-abc-supermarket', {
            name: 'Rohan Verma',
            email: testEmail,
            role: 'STAFF',
            password: customPassword
        });
        assert(invitedUser.email === testEmail, 'Team member invited with custom password');
        // Login with invited credentials
        const loggedInvited = await authService.login(testEmail, customPassword);
        assert(loggedInvited.id === invitedUser.id, 'Invited member authenticates with assigned password');
        // Wrong password check
        let wrongInvitedPassRejected = false;
        try {
            await authService.login(testEmail, 'wrongPassword');
        }
        catch {
            wrongInvitedPassRejected = true;
        }
        assert(wrongInvitedPassRejected, 'Invited member cannot login with wrong password');
    }
    catch (err) {
        assert(false, `Invite with password error: ${err.message}`);
    }
    // Test Suite 5: Tenant Workspace Provisioning with Password
    console.log('\n5. Workspace Provisioning with Owner Password:');
    try {
        const newOwnerEmail = `founder.${Date.now()}@solardrive.in`;
        const ownerPassword = 'OwnerSecret2026#';
        const provisionedTenant = await tenantService.provisionTenant({
            name: 'SolarDrive Logistics',
            ownerName: 'Vikas Mehra',
            email: newOwnerEmail,
            phone: '+91 99881 22334',
            applicationId: 'inventory',
            planId: 'plan-professional',
            password: ownerPassword
        });
        assert(provisionedTenant.name === 'SolarDrive Logistics', 'New tenant provisioned successfully');
        // Login as the new tenant owner with their chosen password
        const loggedOwner = await authService.login(newOwnerEmail, ownerPassword);
        assert(loggedOwner.email === newOwnerEmail, 'Provisioned tenant owner authenticates with chosen password');
        // Wrong password for provisioned owner fails
        let wrongOwnerPassRejected = false;
        try {
            await authService.login(newOwnerEmail, 'wrongSecret');
        }
        catch {
            wrongOwnerPassRejected = true;
        }
        assert(wrongOwnerPassRejected, 'Provisioned tenant owner cannot login with wrong password');
    }
    catch (err) {
        assert(false, `Provisioning password error: ${err.message}`);
    }
    console.log('\n====================================================');
    console.log(`RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('====================================================');
    if (testsFailed > 0) {
        process.exit(1);
    }
}
runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
//# sourceMappingURL=verify-password-flows.js.map