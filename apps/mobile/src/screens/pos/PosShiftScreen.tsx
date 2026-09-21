import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AppHeader } from '../../components/layout/AppHeader';
import { KpiCard } from '../../components/common/KpiCard';
import { usePos } from '../../context/PosContext';
import { MobileShiftModal } from '../../components/pos/MobileShiftModal';
import { MobileDrawerMovementModal } from '../../components/pos/MobileDrawerMovementModal';

export const PosShiftScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentShift, openShift, closeShift, recordDrawerMovement } = usePos();

  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [shiftModalMode, setShiftModalMode] = useState<'open' | 'close'>('open');
  const [isDrawerMovementModalOpen, setIsDrawerMovementModalOpen] = useState<boolean>(false);

  const handleOpenShiftPress = () => {
    setShiftModalMode('open');
    setIsShiftModalOpen(true);
  };

  const handleCloseShiftPress = () => {
    setShiftModalMode('close');
    setIsShiftModalOpen(true);
  };

  const formattedStartTime = currentShift
    ? new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Application Header without subtitleBadge */}
      <AppHeader
        navigation={navigation}
        title="Register Shifts"
        icon="cash"
        hideScanner
        onAvatarPress={() => navigation.navigate('PosAccountTab')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SHIFT STATUS HERO CARD */}
        <View style={[styles.statusHeroCard, currentShift ? styles.statusHeroOpen : styles.statusHeroClosed]}>
          <View style={styles.statusHeroTop}>
            <View style={styles.cashierAvatarWrap}>
              <Text style={styles.cashierAvatarText}>
                {currentShift?.cashierName ? currentShift.cashierName.slice(0, 2).toUpperCase() : 'POS'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.statusHeaderRow}>
                <Text style={styles.statusRegisterId}>
                  {currentShift?.registerId || 'Register 01'}
                </Text>
                <Badge
                  label={currentShift ? 'REGISTER OPEN' : 'REGISTER CLOSED'}
                  variant={currentShift ? 'success' : 'muted'}
                  size="sm"
                />
              </View>

              <Text style={styles.cashierNameText}>
                {currentShift ? currentShift.cashierName : 'No Active Cashier'}
              </Text>

              <Text style={styles.shiftTimeText}>
                {currentShift
                  ? `Shift started today at ${formattedStartTime}`
                  : 'Open register drawer to begin billing sales.'}
              </Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <View style={styles.heroActionWrap}>
            {currentShift ? (
              <Button
                label="Close Shift & Count Drawer"
                variant="danger"
                icon="close"
                onPress={handleCloseShiftPress}
              />
            ) : (
              <Button
                label="Open Register Shift (Enter Float)"
                variant="primary"
                icon="cash"
                onPress={handleOpenShiftPress}
              />
            )}
          </View>
        </View>

        {currentShift && (
          <>
            {/* DRAWER BALANCE HERO BANNER */}
            <View style={styles.expectedCashCard}>
              <View style={styles.expectedCardHeader}>
                <View style={styles.expectedIconWrap}>
                  <Icon name="cash" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.expectedCardLabel}>Expected Physical Cash in Drawer</Text>
              </View>

              <Text style={styles.expectedCardAmount}>
                ₹{currentShift.expectedCashInDrawer.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>

              <View style={styles.formulaStrip}>
                <Text style={styles.formulaText}>
                  Float ₹{currentShift.startingFloat} + Cash Sales ₹{currentShift.cashSales} + In ₹{currentShift.cashIn} - Out ₹{currentShift.cashOut}
                </Text>
              </View>
            </View>

            {/* PERFORMANCE 2x2 METRICS GRID */}
            <Text style={styles.sectionTitle}>Shift Performance & Payment Split</Text>
            <View style={styles.metricsGrid}>
              <KpiCard
                label="Starting Float"
                value={`₹${currentShift.startingFloat.toLocaleString('en-IN')}`}
                subtext="Opening cash reserve"
                icon="cash"
                variant="primary"
              />
              <KpiCard
                label="Cash Sales"
                value={`₹${currentShift.cashSales.toLocaleString('en-IN')}`}
                subtext="Collected in drawer"
                icon="receipt"
                variant="success"
              />
              <KpiCard
                label="UPI / QR Sales"
                value={`₹${currentShift.upiSales.toLocaleString('en-IN')}`}
                subtext="Direct bank transfers"
                icon="smartphone"
                variant="primary"
              />
              <KpiCard
                label="Card Sales"
                value={`₹${currentShift.cardSales.toLocaleString('en-IN')}`}
                subtext="EDC swipe terminal"
                icon="creditCard"
                variant="primary"
              />
            </View>

            {/* DRAWER OPERATIONS TOOLBAR */}
            <Text style={styles.sectionTitle}>Drawer Operations</Text>
            <View style={styles.drawerActionsRow}>
              <Button
                size="sm"
                variant="outline"
                label="Cash In (Add Float)"
                icon="plus"
                onPress={() => setIsDrawerMovementModalOpen(true)}
                style={{ flex: 1 }}
              />
              <Button
                size="sm"
                variant="outline"
                label="Cash Out (Payout / Drop)"
                icon="minus"
                onPress={() => setIsDrawerMovementModalOpen(true)}
                style={{ flex: 1 }}
              />
            </View>

            {/* SHIFT ACTIVITY SUMMARY CARD */}
            <View style={styles.activitySummaryCard}>
              <Text style={styles.activityCardTitle}>Shift Overview</Text>

              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Total Transactions Completed</Text>
                <Text style={styles.activityValue}>{currentShift.totalTransactions} Bills</Text>
              </View>

              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Credit (Khata) Sales</Text>
                <Text style={styles.activityValue}>₹{currentShift.creditKhataSales.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Cash In / Top-ups</Text>
                <Text style={styles.activityValue}>₹{currentShift.cashIn}</Text>
              </View>

              <View style={[styles.activityRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.activityLabel}>Cash Out / Payouts</Text>
                <Text style={styles.activityValue}>₹{currentShift.cashOut}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Shift Modal (Open / Close) */}
      <MobileShiftModal
        visible={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        mode={shiftModalMode}
        currentShift={currentShift}
        onOpenShift={openShift}
        onCloseShift={closeShift}
      />

      {/* Drawer Movement Modal */}
      <MobileDrawerMovementModal
        visible={isDrawerMovementModalOpen}
        onClose={() => setIsDrawerMovementModalOpen(false)}
        onRecordMovement={recordDrawerMovement}
      />
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
  statusHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...theme.shadows.card
  },
  statusHeroOpen: {
    borderColor: '#A7F3D0'
  },
  statusHeroClosed: {
    borderColor: '#FECACA'
  },
  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cashierAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  cashierAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  statusRegisterId: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  cashierNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.navy
  },
  shiftTimeText: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 2
  },
  heroActionWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  expectedCashCard: {
    backgroundColor: theme.colors.navy,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  expectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  expectedIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  expectedCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  expectedCardAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4
  },
  formulaStrip: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  formulaText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  drawerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  activitySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    ...theme.shadows.card
  },
  activityCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: 12
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  activityLabel: {
    fontSize: 13,
    color: theme.colors.body
  },
  activityValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy
  }
});
