import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AppHeader } from '../../components/layout/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { usePos } from '../../context/PosContext';

export const PosAccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const { taxConfig, currentShift } = usePos();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your cashier terminal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Application Header */}
      <AppHeader
        navigation={navigation}
        title="Store & Terminal"
        subtitleBadge="Terminal Account"
        icon="store"
        hideScanner
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cashier Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 2).toUpperCase() || 'CA'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.userName}>{user?.name || 'Counter Cashier'}</Text>
            <Text style={styles.userRole}>Terminal Cashier • {user?.email || 'cashier@store.in'}</Text>
            <View style={{ marginTop: 4 }}>
              <Badge
                label={currentShift ? 'SHIFT ACTIVE' : 'SHIFT CLOSED'}
                variant={currentShift ? 'success' : 'muted'}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Indian GST Registration Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>GST Registration & Store Details</Text>
          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Trade Name</Text>
              <Text style={styles.metaVal}>{taxConfig.tradeName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Legal Name</Text>
              <Text style={styles.metaVal}>{taxConfig.legalName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>GSTIN</Text>
              <Text style={[styles.metaVal, { fontWeight: '800', color: theme.colors.primary }]}>
                {taxConfig.gstin}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>State & Code</Text>
              <Text style={styles.metaVal}>
                {taxConfig.state} (Code {taxConfig.stateCode})
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>UPI ID</Text>
              <Text style={styles.metaVal}>{taxConfig.upiId}</Text>
            </View>
            <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.metaKey}>Address</Text>
              <Text style={[styles.metaVal, { textAlign: 'right', flex: 1, marginLeft: 16 }]}>
                {taxConfig.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out Action */}
        <View style={{ marginTop: 12 }}>
          <Button label="Sign Out Cashier" variant="danger" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.navy
  },
  userRole: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: 4
  },
  sectionDesc: {
    fontSize: 11,
    color: theme.colors.muted,
    marginBottom: 12
  },
  metaList: {
    marginTop: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  metaKey: {
    fontSize: 12,
    color: theme.colors.muted
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.navy
  }
});
