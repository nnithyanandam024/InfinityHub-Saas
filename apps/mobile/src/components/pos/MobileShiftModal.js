import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import * as ReactNative from 'react-native';
const Modal = ReactNative.Modal;
const KeyboardAvoidingView = ReactNative.KeyboardAvoidingView;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
export const MobileShiftModal = ({ visible, onClose, mode, currentShift, onOpenShift, onCloseShift }) => {
    const [amountInput, setAmountInput] = useState(mode === 'open' ? '1500' : '');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const amount = parseFloat(amountInput) || 0;
    const expectedCash = currentShift?.expectedCashInDrawer || 0;
    const variance = amount - expectedCash;
    const handleSubmit = async () => {
        if (amount < 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid non-negative amount.');
            return;
        }
        setIsSubmitting(true);
        try {
            if (mode === 'open') {
                await onOpenShift(amount, notes);
                Alert.alert('Shift Opened', `Register shift opened successfully with starting float of ₹${amount}.`);
            }
            else {
                await onCloseShift(amount, notes);
                Alert.alert('Shift Closed', `Shift closed successfully. End of day Z-report has been generated.`);
            }
            onClose();
        }
        catch (err) {
            Alert.alert('Error', err.message || 'Failed to update shift');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose}/>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, mode === 'open' ? styles.iconOpen : styles.iconClose]}>
                <Text style={styles.headerEmoji}>{mode === 'open' ? '🟢' : '🔴'}</Text>
              </View>
              <View>
                <Text style={styles.title}>
                  {mode === 'open' ? 'Open Register Shift' : 'Close Shift & Z-Report'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'open' ? 'Enter starting cash float' : 'Count physical cash in drawer'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={theme.colors.body}/>
            </TouchableOpacity>
          </View>

          {/* If Closing Shift: Show Expected Drawer Cash */}
          {mode === 'close' && (<View style={styles.expectedCard}>
              <View style={styles.expectedRow}>
                <Text style={styles.expectedLabel}>System Expected Cash:</Text>
                <Text style={styles.expectedVal}>₹{expectedCash.toFixed(2)}</Text>
              </View>
              <Text style={styles.expectedHint}>
                Based on starting float + cash sales + cash in - cash out
              </Text>
            </View>)}

          {/* Amount Input */}
          <Text style={styles.inputLabel}>
            {mode === 'open' ? 'Starting Float Cash (₹)' : 'Actual Physical Cash Counted (₹)'}
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder={mode === 'open' ? 'e.g. 1500' : 'Enter counted cash'} placeholderTextColor={theme.colors.muted} value={amountInput} onChangeText={setAmountInput} autoFocus/>
          </View>

          {/* If Closing Shift: Show Over / Short Variance */}
          {mode === 'close' && amountInput.length > 0 && (<View style={[styles.varianceBox, variance === 0 ? styles.varBalanced : variance > 0 ? styles.varOver : styles.varShort]}>
              <Text style={styles.varTitle}>
                {variance === 0 ? 'Drawer Balanced Exactly' : variance > 0 ? 'Drawer Over (Excess):' : 'Drawer Short (Deficit):'}
              </Text>
              <Text style={styles.varAmount}>
                {variance === 0 ? '₹0.00' : `${variance > 0 ? '+' : ''}₹${variance.toFixed(2)}`}
              </Text>
            </View>)}

          {/* Notes Input */}
          <Text style={styles.inputLabel}>Notes / Reason (Optional)</Text>
          <View style={[styles.inputContainer, { height: 60, alignItems: 'flex-start', paddingTop: 8 }]}>
            <TextInput style={[styles.input, { height: 44 }]} placeholder="e.g. Starting register float, denominations verified" placeholderTextColor={theme.colors.muted} value={notes} onChangeText={setNotes} multiline/>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button label={isSubmitting ? 'Submitting...' : mode === 'open' ? 'Confirm & Open Shift' : 'Reconcile & Close Shift'} variant={mode === 'open' ? 'primary' : 'danger'} onPress={handleSubmit} disabled={isSubmitting}/>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>);
};
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'flex-end'
    },
    backdropTouch: {
        flex: 1
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconOpen: {
        backgroundColor: '#ECFDF5'
    },
    iconClose: {
        backgroundColor: '#FEF2F2'
    },
    headerEmoji: {
        fontSize: 18
    },
    title: {
        ...theme.typography.bodyBold,
        fontSize: 16
    },
    subtitle: {
        ...theme.typography.caption,
        marginTop: 2
    },
    closeBtn: {
        padding: 6,
        borderRadius: 100,
        backgroundColor: theme.colors.surfaceSubtle
    },
    expectedCard: {
        backgroundColor: theme.colors.surfaceSubtle,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    expectedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    expectedLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.navy
    },
    expectedVal: {
        fontSize: 15,
        fontWeight: '900',
        color: theme.colors.primary
    },
    expectedHint: {
        fontSize: 10,
        color: theme.colors.muted,
        marginTop: 4
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.navy,
        marginBottom: 6
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 12
    },
    currencyPrefix: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.primary,
        marginRight: 8
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.navy
    },
    varianceBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1
    },
    varBalanced: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0'
    },
    varOver: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE'
    },
    varShort: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA'
    },
    varTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.navy
    },
    varAmount: {
        fontSize: 14,
        fontWeight: '900'
    },
    actions: {
        paddingTop: 8
    }
});
//# sourceMappingURL=MobileShiftModal.js.map