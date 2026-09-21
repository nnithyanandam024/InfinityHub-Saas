import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useAuth, DEMO_PERSONAS, DemoPersona } from '../../context/AuthContext';

type SuiteFilter = 'all' | 'inventory' | 'pos' | 'restaurant';

export const LoginScreen: React.FC<{ navigation: any }> = () => {
  const { login, loginAsPersona } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState('Verifying store credentials...');
  const [selectedSuite, setSelectedSuite] = useState<SuiteFilter>('all');

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

  const handleQuickLogin = (p: DemoPersona) => {
    setIsAuthenticating(true);
    setAuthMessage(`Connecting to ${p.tenantName} (${p.appLabel})...`);

    setTimeout(() => {
      loginAsPersona(p.key);
    }, 350);
  };

  const handleFillCredentials = (p: DemoPersona) => {
    setEmail(p.email);
    setPassword('password123');
    setError('');
  };

  const filteredPersonas = useMemo(() => {
    if (selectedSuite === 'all') {
      // Primary store accounts for all 3 apps
      return DEMO_PERSONAS.filter(p => [
        'abc-supermarket-owner',
        'city-retail-owner',
        'xyz-restaurant-owner'
      ].includes(p.key));
    }
    return DEMO_PERSONAS.filter(p => p.appId === selectedSuite);
  }, [selectedSuite]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Brand Header Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Icon name="package" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>InfinityHub Mobile</Text>
          <Text style={styles.brandSubtitle}>Unified Business Suite: Inventory, POS & Restaurant</Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Sign in to your account</Text>
          <Text style={styles.formSubtitle}>Enter store credentials to access your terminal</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert" size={14} color={theme.colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor={theme.colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={theme.colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            label="Sign In"
            onPress={handleLogin}
            variant="primary"
            size="lg"
            style={{ marginTop: 14 }}
          />
        </View>

        {/* Sample Store Accounts Showcase */}
        <View style={styles.personaSection}>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>EVALUATION STORE ACCOUNTS</Text>
            <View style={styles.divider} />
          </View>
          <Text style={styles.personaHint}>
            Select a sample store account to launch into that application:
          </Text>

          {/* Suite Filter Tabs */}
          <View style={styles.filterTabsWrap}>
            <TouchableOpacity
              style={[styles.filterTab, selectedSuite === 'all' && styles.filterTabActive]}
              onPress={() => setSelectedSuite('all')}
            >
              <Text style={[styles.filterTabText, selectedSuite === 'all' && styles.filterTabTextActive]}>
                All (3 Apps)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, selectedSuite === 'inventory' && styles.filterTabActive]}
              onPress={() => setSelectedSuite('inventory')}
            >
              <Text style={[styles.filterTabText, selectedSuite === 'inventory' && styles.filterTabTextActive]}>
                Inventory
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, selectedSuite === 'pos' && styles.filterTabActive]}
              onPress={() => setSelectedSuite('pos')}
            >
              <Text style={[styles.filterTabText, selectedSuite === 'pos' && styles.filterTabTextActive]}>
                POS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, selectedSuite === 'restaurant' && styles.filterTabActive]}
              onPress={() => setSelectedSuite('restaurant')}
            >
              <Text style={[styles.filterTabText, selectedSuite === 'restaurant' && styles.filterTabTextActive]}>
                Restaurant
              </Text>
            </TouchableOpacity>
          </View>

          {/* Store Account Cards */}
          {filteredPersonas.map(p => {
            const isInventory = p.appId === 'inventory';
            const isPos = p.appId === 'pos';
            const isRestaurant = p.appId === 'restaurant';

            const badgeBg = isInventory
              ? '#EFF6FF'
              : isPos
              ? '#EEF2FF'
              : '#FFF7ED';

            const badgeColor = isInventory
              ? '#2563EB'
              : isPos
              ? '#4F46E5'
              : '#EA580C';

            return (
              <View key={p.key} style={styles.storeCard}>
                {/* Top Row: Icon, Suite Badge, and Store Details */}
                <View style={styles.cardHeader}>
                  <View style={[styles.storeIconWrap, { backgroundColor: badgeBg }]}>
                    <Icon name={p.icon} size={22} color={badgeColor} />
                  </View>

                  <View style={styles.storeHeaderInfo}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.appBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.appBadgeText, { color: badgeColor }]}>
                          {p.appLabel.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rolePill}>
                        <Text style={styles.rolePillText}>{p.roleLabel}</Text>
                      </View>
                    </View>

                    <Text style={styles.storeTitle}>{p.tenantName}</Text>
                    <Text style={styles.storeOwnerName}>{p.name}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.storeDesc}>{p.description}</Text>

                {/* Features Tags */}
                {p.features && p.features.length > 0 && (
                  <View style={styles.featuresRow}>
                    {p.features.map((feat, index) => (
                      <View key={index} style={styles.featurePill}>
                        <Text style={styles.featurePillText}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Credentials Banner */}
                <View style={styles.credentialsBanner}>
                  <Text style={styles.credLabel}>Email:</Text>
                  <Text style={styles.credValue}>{p.email}</Text>
                  <Text style={styles.credDot}>·</Text>
                  <Text style={styles.credLabel}>Pass:</Text>
                  <Text style={styles.credValue}>password123</Text>
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.fillBtn}
                    onPress={() => handleFillCredentials(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fillBtnText}>Fill Form</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickLoginBtn, { backgroundColor: badgeColor }]}
                    onPress={() => handleQuickLogin(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickLoginBtnText}>1-Tap Sign In</Text>
                    <Icon name="chevronRight" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {isAuthenticating && (
        <LoadingScreen
          overlay
          message={authMessage}
          subMessage="Synchronizing catalog, floor data & registers"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 48
  },
  brandContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.navy,
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.body,
    marginTop: 3,
    textAlign: 'center'
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
    marginTop: theme.spacing.xxl
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.muted,
    marginHorizontal: 10,
    letterSpacing: 0.8
  },
  personaHint: {
    fontSize: 12,
    color: theme.colors.body,
    textAlign: 'center',
    marginBottom: 14
  },
  filterTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: theme.radii.sm
  },
  filterTabActive: {
    backgroundColor: theme.colors.navy
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.body
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: 12,
    ...theme.shadows.card
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  storeHeaderInfo: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3
  },
  appBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radii.sm
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  rolePill: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.muted
  },
  storeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.navy
  },
  storeOwnerName: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.body,
    marginTop: 1
  },
  storeDesc: {
    fontSize: 12,
    color: theme.colors.body,
    lineHeight: 16,
    marginBottom: 10
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  featurePill: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.body
  },
  credentialsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12
  },
  credLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted,
    marginRight: 4
  },
  credValue: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: theme.colors.navy
  },
  credDot: {
    fontSize: 10,
    color: theme.colors.muted,
    marginHorizontal: 6
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  },
  quickLoginBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.radii.md
  },
  quickLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
