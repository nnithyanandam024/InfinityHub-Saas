import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { usePos } from '../../context/PosContext';
import { MobileShiftModal } from '../../components/pos/MobileShiftModal';
import { MobileDrawerMovementModal } from '../../components/pos/MobileDrawerMovementModal';
export const PosShiftScreen = ({ navigation }) => {
    const { currentShift, openShift, closeShift, recordDrawerMovement } = usePos();
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [shiftModalMode, setShiftModalMode] = useState('open');
    const [isDrawerMovementModalOpen, setIsDrawerMovementModalOpen] = useState(false);
    const handleOpenShiftPress = () => {
        setShiftModalMode('open');
        setIsShiftModalOpen(true);
    };
    const handleCloseShiftPress = () => {
        setShiftModalMode('close');
        setIsShiftModalOpen(true);
    };
    return (<SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Register Shifts & Cash Drawer</Text>
          <Text style={styles.headerSubtitle}>
            Cash float tracking, drawer drops & Z-report reconciliation
          </Text>
        </View>
        <Badge label={currentShift ? 'REGISTER OPEN' : 'REGISTER CLOSED'} variant={currentShift ? 'success' : 'danger'} size="sm"/>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SHIFT STATUS BANNER */}
        <View style={[styles.statusCard, currentShift ? styles.statusCardOpen : styles.statusCardClosed]}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconCircle}>
              <Text style={styles.statusEmoji}>{currentShift ? '🟢' : '🔴'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.shiftCardTitle}>
                {currentShift ? `Active Shift: ${currentShift.cashierName}` : 'No Active Shift'}
              </Text>
              <Text style={styles.shiftCardSubtitle}>
                {currentShift
            ? `Opened: ${new Date(currentShift.startTime).toLocaleTimeString('en-IN')}`
            : 'Register drawer is closed. Open shift to accept sales.'}
              </Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <View style={{ marginTop: 14 }}>
            {currentShift ? (<Button label="Close Shift & Print Z-Report" variant="danger" onPress={handleCloseShiftPress}/>) : (<Button label="Open Register Shift (Enter Float)" variant="primary" onPress={handleOpenShiftPress}/>)}
          </View>
        </View>

        {/* DRAWER BALANCE CARDS */}
        {currentShift && (<>
            {/* Big Expected Drawer Cash Card */}
            <View style={styles.expectedCashCard}>
              <Text style={styles.expectedCardLabel}>Expected Physical Cash in Drawer</Text>
              <Text style={styles.expectedCardAmount}>
                ₹{currentShift.expectedCashInDrawer.toFixed(2)}
              </Text>
              <Text style={styles.expectedCardSub}>
                Starting Float (₹{currentShift.startingFloat}) + Cash Sales (₹{currentShift.cashSales}) + Cash In (₹{currentShift.cashIn}) - Cash Out (₹{currentShift.cashOut})
              </Text>
            </View>

            {/* Shift Breakdown Metric Cards */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Starting Float</Text>
                <Text style={styles.metricVal}>₹{currentShift.startingFloat}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cash Sales</Text>
                <Text style={[styles.metricVal, { color: '#059669' }]}>
                  ₹{currentShift.cashSales}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>UPI Sales</Text>
                <Text style={[styles.metricVal, { color: theme.colors.primary }]}>
                  ₹{currentShift.upiSales}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Card / EDC</Text>
                <Text style={styles.metricVal}>₹{currentShift.cardSales}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cash Paid-In</Text>
                <Text style={[styles.metricVal, { color: '#059669' }]}>
                  +₹{currentShift.cashIn}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cash Paid-Out</Text>
                <Text style={[styles.metricVal, { color: '#DC2626' }]}>
                  -₹{currentShift.cashOut}
                </Text>
              </View>
            </View>

            {/* Drawer Management Action Buttons */}
            <View style={styles.drawerActionsRow}>
              <TouchableOpacity style={styles.drawerActionBtn} onPress={() => setIsDrawerMovementModalOpen(true)}>
                <Icon name="cash" size={16} color={theme.colors.primary}/>
                <Text style={styles.drawerActionBtnText}>Record Cash In / Out</Text>
              </TouchableOpacity>
            </View>
          </>)}

        {/* Shift Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.glTitle}>Cashier Shift Rules & Best Practices</Text>
          <View style={styles.glRow}>
            <Text style={styles.glBullet}>•</Text>
            <Text style={styles.glText}>
              Always verify your starting cash float before taking your first customer.
            </Text>
          </View>
          <View style={styles.glRow}>
            <Text style={styles.glBullet}>•</Text>
            <Text style={styles.glText}>
              Log every petty cash expense or safe deposit with a mandatory reason.
            </Text>
          </View>
          <View style={styles.glRow}>
            <Text style={styles.glBullet}>•</Text>
            <Text style={styles.glText}>
              Count physical cash carefully at close. Discrepancies are logged in the store audit log.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Shift Modal (Open / Close) */}
      <MobileShiftModal visible={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} mode={shiftModalMode} currentShift={currentShift} onOpenShift={openShift} onCloseShift={closeShift}/>

      {/* Drawer Movement Modal */}
      <MobileDrawerMovementModal visible={isDrawerMovementModalOpen} onClose={() => setIsDrawerMovementModalOpen(false)} onRecordMovement={recordDrawerMovement}/>
    </SafeAreaView>);
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    statusCard: {
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        marginBottom: 14
    },
    statusCardOpen: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0'
    },
    statusCardClosed: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA'
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    statusIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    statusEmoji: {
        fontSize: 20
    },
    shiftCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.navy
    },
    shiftCardSubtitle: {
        fontSize: 12,
        color: theme.colors.body,
        marginTop: 2
    },
    expectedCashCard: {
        backgroundColor: theme.colors.navy,
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4
    },
    expectedCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8'
    },
    expectedCardAmount: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFFFFF',
        marginVertical: 4
    },
    expectedCardSub: {
        fontSize: 10,
        color: '#CBD5E1',
        textAlign: 'center'
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14
    },
    metricCard: {
        width: '48.5%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    metricLabel: {
        fontSize: 11,
        color: theme.colors.muted
    },
    metricVal: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.navy,
        marginTop: 2
    },
    drawerActionsRow: {
        flexDirection: 'row',
        marginBottom: 14
    },
    drawerActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    drawerActionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary
    },
    guidelinesCard: {
        backgroundColor: theme.colors.surfaceSubtle,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    glTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.navy,
        marginBottom: 8
    },
    glRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6
    },
    glBullet: {
        fontSize: 14,
        color: theme.colors.primary,
        marginRight: 6
    },
    glText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.body,
        lineHeight: 16
    }
});
//# sourceMappingURL=PosShiftScreen.js.map