import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { usePos } from '../../context/PosContext';
import { useApp } from '../../context/AppContext';
import { AppLauncherModal } from '../../components/modals/AppLauncherModal';
export const PosAccountScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { tenant } = useTenant();
    const { taxConfig, currentShift } = usePos();
    const { switchApp } = useApp();
    const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
    const handleSwitchToInventory = () => {
        switchApp('inventory');
    };
    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out of your cashier terminal?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout }
        ]);
    };
    return (<SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Store & Terminal Account</Text>
        <Text style={styles.headerSubtitle}>GST registration, terminal settings & suites</Text>
      </View>

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
              <Badge label={currentShift ? 'SHIFT ACTIVE' : 'SHIFT CLOSED'} variant={currentShift ? 'success' : 'muted'} size="sm"/>
            </View>
          </View>
        </View>

        {/* Business Suite Switcher Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Application Suite</Text>
          <Text style={styles.sectionDesc}>
            Currently operating in <Text style={{ fontWeight: '800', color: theme.colors.primary }}>Retail Billing & POS</Text>.
          </Text>

          <View style={styles.switchButtonRow}>
            <TouchableOpacity style={styles.switchSuiteBtn} onPress={handleSwitchToInventory} activeOpacity={0.8}>
              <Icon name="package" size={18} color={theme.colors.primary}/>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.switchBtnTitle}>Switch to Inventory Suite</Text>
                <Text style={styles.switchBtnSub}>SKUs, stock adjustments & warehouses</Text>
              </View>
              <Icon name="chevronRight" size={16} color={theme.colors.muted}/>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.switchSuiteBtn, { marginTop: 8 }]} onPress={() => setIsAppLauncherOpen(true)} activeOpacity={0.8}>
              <Icon name="appLauncher" size={18} color={theme.colors.navy}/>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.switchBtnTitle, { color: theme.colors.navy }]}>
                  All Business Suites
                </Text>
                <Text style={styles.switchBtnSub}>Browse apps & permissions</Text>
              </View>
              <Icon name="chevronRight" size={16} color={theme.colors.muted}/>
            </TouchableOpacity>
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
          <Button label="Sign Out Cashier" variant="danger" onPress={handleLogout}/>
        </View>
      </ScrollView>

      {/* App Launcher Modal */}
      <AppLauncherModal visible={isAppLauncherOpen} onClose={() => setIsAppLauncherOpen(false)}/>
    </SafeAreaView>);
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.navy
    },
    headerSubtitle: {
        fontSize: 11,
        color: theme.colors.muted,
        marginTop: 2
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40
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
    switchButtonRow: {
        gap: 8
    },
    switchSuiteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceSubtle,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    switchBtnTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary
    },
    switchBtnSub: {
        fontSize: 10,
        color: theme.colors.muted,
        marginTop: 1
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
//# sourceMappingURL=PosAccountScreen.js.map