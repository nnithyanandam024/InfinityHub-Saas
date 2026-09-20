import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';
export const LoginScreen = () => {
    const { login, loginAsPersona } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authMessage, setAuthMessage] = useState('Verifying store credentials...');
    const handleLogin = () => {
        if (!email.trim()) {
            setError('Please enter your work email');
            return;
        }
        setError('');
        setIsAuthenticating(true);
        setAuthMessage('Authenticating store account...');
        setTimeout(() => {
            const success = login(email, password);
            if (!success) {
                setIsAuthenticating(false);
                setError('Invalid store credentials or account not found');
            }
        }, 450);
    };
    const handleSelectPersona = (key) => {
        setIsAuthenticating(true);
        setAuthMessage('Loading store profile & catalog...');
        setTimeout(() => {
            loginAsPersona(key);
        }, 350);
    };
    return (<SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Icon name="package" size={24} color="#FFFFFF"/>
          </View>
          <Text style={styles.brandTitle}>InfinityHub</Text>
          <Text style={styles.brandSubtitle}>Business Software Platform</Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Sign in to your account</Text>
          <Text style={styles.formSubtitle}>Access inventory, catalog, and store operations</Text>

          {error ? (<View style={styles.errorBox}>
              <Icon name="alert" size={14} color={theme.colors.danger} style={{ marginRight: 6 }}/>
              <Text style={styles.errorText}>{error}</Text>
            </View>) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="name@company.com" placeholderTextColor={theme.colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor={theme.colors.muted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword}/>
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button label="Sign In" onPress={handleLogin} variant="primary" size="lg" style={{ marginTop: 14 }}/>
        </View>

        {/* Sample Accounts for Testing */}
        <View style={styles.personaSection}>
          <View style={styles.dividerRow}>
            <View style={styles.divider}/>
            <Text style={styles.dividerText}>SAMPLE STORE ACCOUNTS</Text>
            <View style={styles.divider}/>
          </View>
          <Text style={styles.personaHint}>
            Select a store profile to evaluate:
          </Text>

          {DEMO_PERSONAS.slice(0, 3).map(p => (<TouchableOpacity key={p.key} style={styles.personaCard} onPress={() => handleSelectPersona(p.key)} activeOpacity={0.7}>
              <View style={styles.personaRoleBadge}>
                <Text style={styles.personaRoleText}>{p.roleLabel}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.personaName}>{p.name}</Text>
                <Text style={styles.personaDesc} numberOfLines={1}>{p.description}</Text>
              </View>
              <Icon name="chevronRight" size={14} color={theme.colors.muted}/>
            </TouchableOpacity>))}
        </View>
      </ScrollView>

      {isAuthenticating && (<LoadingScreen overlay message={authMessage} subMessage="Synchronizing catalog & stock levels"/>)}
    </SafeAreaView>);
};
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: 40
    },
    brandContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.xl
    },
    logoBadge: {
        width: 48,
        height: 48,
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.navy,
        letterSpacing: -0.5
    },
    brandSubtitle: {
        fontSize: 13,
        color: theme.colors.body,
        marginTop: 2
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.card
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.navy
    },
    formSubtitle: {
        fontSize: 12,
        color: theme.colors.body,
        marginTop: 2,
        marginBottom: theme.spacing.md
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.dangerBg,
        padding: 8,
        borderRadius: theme.radii.sm,
        marginBottom: theme.spacing.md
    },
    errorText: {
        fontSize: 12,
        color: theme.colors.dangerText
    },
    inputGroup: {
        marginBottom: theme.spacing.md
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.navy,
        marginBottom: 6
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        paddingHorizontal: 12,
        height: 44,
        backgroundColor: '#FFFFFF'
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.navy,
        paddingVertical: 0
    },
    eyeBtn: {
        paddingHorizontal: 4
    },
    eyeText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary
    },
    personaSection: {
        marginTop: theme.spacing.xl
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.muted,
        marginHorizontal: 10,
        letterSpacing: 0.5
    },
    personaHint: {
        fontSize: 12,
        color: theme.colors.body,
        textAlign: 'center',
        marginBottom: 12
    },
    personaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
        marginBottom: 8
    },
    personaRoleBadge: {
        backgroundColor: theme.colors.primaryTint,
        borderRadius: theme.radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 3
    },
    personaRoleText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primary
    },
    personaName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.navy
    },
    personaDesc: {
        fontSize: 11,
        color: theme.colors.body,
        marginTop: 1
    }
});
//# sourceMappingURL=LoginScreen.js.map