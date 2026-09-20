import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Platform, Alert } from 'react-native';
import * as ReactNative from 'react-native';
const Modal = ReactNative.Modal;
const KeyboardAvoidingView = ReactNative.KeyboardAvoidingView;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { usePos } from '../../context/PosContext';
import { generateUpiQrImageUrl } from '../../utils/mobileUpiQr';
export const MobilePaymentModal = ({ visible, onClose, onCompleteCheckout }) => {
    const { totals, taxConfig, customers, selectedCustomer, setSelectedCustomer } = usePos();
    const grandTotal = totals.grandTotal;
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [tenderedInput, setTenderedInput] = useState(String(grandTotal));
    const [referenceId, setReferenceId] = useState('');
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    useEffect(() => {
        if (visible) {
            setTenderedInput(String(grandTotal));
            setReferenceId('');
            setNotes('');
            setIsProcessing(false);
        }
    }, [visible, grandTotal]);
    const tenderedAmount = parseFloat(tenderedInput) || 0;
    const changeDue = Math.max(0, tenderedAmount - grandTotal);
    const isCashShort = selectedMethod === 'cash' && tenderedAmount < grandTotal;
    // Quick denomination chip click
    const handleCashDenom = (denom) => {
        if (denom === 'exact') {
            setTenderedInput(String(grandTotal));
        }
        else {
            setTenderedInput(String(denom));
        }
    };
    const handleCheckoutSubmit = async () => {
        if (grandTotal <= 0) {
            Alert.alert('Empty Cart', 'Please add items to cart before proceeding to payment.');
            return;
        }
        if (selectedMethod === 'cash' && tenderedAmount < grandTotal) {
            Alert.alert('Insufficient Cash', `Tendered amount (₹${tenderedAmount}) is less than total payable (₹${grandTotal}).`);
            return;
        }
        if (selectedMethod === 'credit_khata') {
            if (!selectedCustomer) {
                Alert.alert('Customer Required', 'Please attach a customer to charge to Khata credit ledger.');
                return;
            }
            const newBalance = selectedCustomer.currentBalance + grandTotal;
            if (newBalance > selectedCustomer.creditLimit) {
                Alert.alert('Credit Limit Exceeded', `${selectedCustomer.name}'s credit limit is ₹${selectedCustomer.creditLimit}. Current debt is ₹${selectedCustomer.currentBalance}. This sale would exceed the limit by ₹${newBalance - selectedCustomer.creditLimit}.`);
                return;
            }
        }
        setIsProcessing(true);
        try {
            const paymentRecord = {
                method: selectedMethod,
                amount: grandTotal,
                referenceId: referenceId || undefined,
                upiId: selectedMethod === 'upi' ? taxConfig.upiId : undefined,
                notes: notes || undefined
            };
            await onCompleteCheckout({
                payments: [paymentRecord],
                tenderedAmount: selectedMethod === 'cash' ? tenderedAmount : grandTotal,
                changeDue: selectedMethod === 'cash' ? changeDue : 0,
                notes
            });
            onClose();
        }
        catch (err) {
            Alert.alert('Payment Error', err.message || 'Failed to complete transaction');
        }
        finally {
            setIsProcessing(false);
        }
    };
    // Dynamic QR Code for UPI
    const qrUrl = generateUpiQrImageUrl(taxConfig.upiId, taxConfig.tradeName, grandTotal, `ORDER-${Date.now().toString().slice(-4)}`);
    return (<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose}/>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Select Payment Method</Text>
              <Text style={styles.headerSubtitle}>Complete checkout & print GST invoice</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={theme.colors.body}/>
            </TouchableOpacity>
          </View>

          {/* Grand Total Banner */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalLabel}>Total Payable Amount</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>

          {/* Payment Method Selector Grid */}
          <View style={styles.methodsGrid}>
            <TouchableOpacity style={[styles.methodCard, selectedMethod === 'cash' && styles.methodCardActive]} onPress={() => setSelectedMethod('cash')}>
              <View style={[styles.methodIconWrap, selectedMethod === 'cash' && styles.methodIconWrapActive]}>
                <Text style={styles.methodEmoji}>💵</Text>
              </View>
              <Text style={[styles.methodName, selectedMethod === 'cash' && styles.methodNameActive]}>Cash</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.methodCard, selectedMethod === 'upi' && styles.methodCardActive]} onPress={() => setSelectedMethod('upi')}>
              <View style={[styles.methodIconWrap, selectedMethod === 'upi' && styles.methodIconWrapActive]}>
                <Text style={styles.methodEmoji}>📱</Text>
              </View>
              <Text style={[styles.methodName, selectedMethod === 'upi' && styles.methodNameActive]}>UPI QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.methodCard, selectedMethod === 'card' && styles.methodCardActive]} onPress={() => setSelectedMethod('card')}>
              <View style={[styles.methodIconWrap, selectedMethod === 'card' && styles.methodIconWrapActive]}>
                <Text style={styles.methodEmoji}>💳</Text>
              </View>
              <Text style={[styles.methodName, selectedMethod === 'card' && styles.methodNameActive]}>Card / POS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.methodCard, selectedMethod === 'credit_khata' && styles.methodCardActive]} onPress={() => setSelectedMethod('credit_khata')}>
              <View style={[styles.methodIconWrap, selectedMethod === 'credit_khata' && styles.methodIconWrapActive]}>
                <Text style={styles.methodEmoji}>📒</Text>
              </View>
              <Text style={[styles.methodName, selectedMethod === 'credit_khata' && styles.methodNameActive]}>Khata</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.methodContent} showsVerticalScrollIndicator={false}>
            {/* CASH PAYMENT UI */}
            {selectedMethod === 'cash' && (<View style={styles.methodPane}>
                {/* Denomination Quick Buttons */}
                <Text style={styles.sectionLabel}>Quick Cash Denominations</Text>
                <View style={styles.denomRow}>
                  <TouchableOpacity style={styles.denomBtn} onPress={() => handleCashDenom('exact')}>
                    <Text style={styles.denomBtnText}>Exact (₹{grandTotal})</Text>
                  </TouchableOpacity>
                  {[100, 200, 500, 2000].map(d => (<TouchableOpacity key={d} style={styles.denomBtn} onPress={() => handleCashDenom(d)}>
                      <Text style={styles.denomBtnText}>₹{d}</Text>
                    </TouchableOpacity>))}
                </View>

                {/* Tendered Input */}
                <Text style={styles.sectionLabel}>Tendered Amount from Customer</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput style={styles.textInput} keyboardType="numeric" value={tenderedInput} onChangeText={setTenderedInput} placeholder="Enter cash received"/>
                </View>

                {/* Change Due Indicator */}
                <View style={[styles.changeCard, isCashShort ? styles.changeCardShort : styles.changeCardOk]}>
                  <Text style={styles.changeLabel}>
                    {isCashShort ? 'Cash Shortage:' : 'Return Change to Customer:'}
                  </Text>
                  <Text style={[styles.changeAmount, isCashShort ? styles.changeAmountShort : styles.changeAmountOk]}>
                    ₹{Math.abs(tenderedAmount - grandTotal).toFixed(2)}
                  </Text>
                </View>
              </View>)}

            {/* UPI QR PAYMENT UI */}
            {selectedMethod === 'upi' && (<View style={[styles.methodPane, { alignItems: 'center' }]}>
                <Text style={styles.upiInstructions}>
                  Scan to Pay using Google Pay, PhonePe, Paytm or BHIM
                </Text>

                <View style={styles.qrCard}>
                  <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain"/>
                </View>

                <View style={styles.upiMetaBox}>
                  <Text style={styles.upiMerchantName}>{taxConfig.tradeName}</Text>
                  <Text style={styles.upiVpa}>UPI ID: {taxConfig.upiId}</Text>
                  <Text style={styles.upiPayable}>Payable: ₹{grandTotal.toFixed(2)}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput style={[styles.textInput, { fontSize: 13 }]} placeholder="Optional: Enter UPI UTR / Reference ID" value={referenceId} onChangeText={setReferenceId}/>
                </View>
              </View>)}

            {/* CARD PAYMENT UI */}
            {selectedMethod === 'card' && (<View style={styles.methodPane}>
                <Text style={styles.sectionLabel}>Swipe / Dip on EDC Card Terminal</Text>
                <View style={styles.cardInfoBox}>
                  <Text style={styles.cardInfoText}>
                    Please swipe or tap customer debit/credit card on the POS machine for ₹{grandTotal.toFixed(2)}.
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>Card Authorization / Transaction ID</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.textInput} placeholder="Enter approval auth code (e.g. 849201)" value={referenceId} onChangeText={setReferenceId}/>
                </View>
              </View>)}

            {/* KHATA (CUSTOMER CREDIT) UI */}
            {selectedMethod === 'credit_khata' && (<View style={styles.methodPane}>
                <Text style={styles.sectionLabel}>Select Khata Customer</Text>

                <View style={styles.customerSelectorList}>
                  {customers.map(c => {
                const isSelected = selectedCustomer?.id === c.id;
                return (<TouchableOpacity key={c.id} style={[styles.customerCard, isSelected && styles.customerCardActive]} onPress={() => setSelectedCustomer(c)}>
                        <View style={styles.customerInfo}>
                          <Text style={[styles.customerName, isSelected && styles.customerNameActive]}>
                            {c.name}
                          </Text>
                          <Text style={styles.customerPhone}>{c.phone}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.customerDebt}>Debt: ₹{c.currentBalance}</Text>
                          <Text style={styles.customerLimit}>Limit: ₹{c.creditLimit}</Text>
                        </View>
                      </TouchableOpacity>);
            })}
                </View>
              </View>)}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <Button label={isProcessing ? 'Processing Order...' : `Complete Order & Charge ₹${grandTotal.toFixed(2)}`} variant="primary" onPress={handleCheckoutSubmit} disabled={isProcessing || isCashShort}/>
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
        maxHeight: '90%',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    headerTitle: {
        ...theme.typography.bodyBold,
        fontSize: 16
    },
    headerSubtitle: {
        ...theme.typography.caption,
        marginTop: 2
    },
    closeBtn: {
        padding: 6,
        borderRadius: 100,
        backgroundColor: theme.colors.surfaceSubtle
    },
    totalBanner: {
        backgroundColor: theme.colors.primaryTint,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.colors.primaryLight
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.body
    },
    totalValue: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.primary,
        marginTop: 2
    },
    methodsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14
    },
    methodCard: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        alignItems: 'center'
    },
    methodCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryTint
    },
    methodIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4
    },
    methodIconWrapActive: {
        backgroundColor: '#FFFFFF'
    },
    methodEmoji: {
        fontSize: 18
    },
    methodName: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.body
    },
    methodNameActive: {
        color: theme.colors.primary
    },
    methodContent: {
        maxHeight: 260,
        marginBottom: 16
    },
    methodPane: {
        paddingTop: 4
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.navy,
        marginBottom: 8
    },
    denomRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14
    },
    denomBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    denomBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.navy
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
    textInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.navy
    },
    changeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1
    },
    changeCardOk: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0'
    },
    changeCardShort: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA'
    },
    changeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065F46'
    },
    changeAmount: {
        fontSize: 18,
        fontWeight: '900'
    },
    changeAmountOk: {
        color: '#059669'
    },
    changeAmountShort: {
        color: '#DC2626'
    },
    upiInstructions: {
        fontSize: 12,
        color: theme.colors.body,
        textAlign: 'center',
        marginBottom: 10
    },
    qrCard: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12
    },
    qrImage: {
        width: 160,
        height: 160
    },
    upiMetaBox: {
        alignItems: 'center',
        marginBottom: 12
    },
    upiMerchantName: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.navy
    },
    upiVpa: {
        fontSize: 11,
        color: theme.colors.primary,
        fontWeight: '600',
        marginTop: 2
    },
    upiPayable: {
        fontSize: 13,
        fontWeight: '900',
        color: '#059669',
        marginTop: 3
    },
    cardInfoBox: {
        backgroundColor: theme.colors.surfaceSubtle,
        padding: 12,
        borderRadius: 10,
        marginBottom: 14
    },
    cardInfoText: {
        fontSize: 12,
        color: theme.colors.body,
        lineHeight: 18
    },
    customerSelectorList: {
        gap: 8
    },
    customerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card
    },
    customerCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryTint
    },
    customerInfo: {
        flex: 1
    },
    customerName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.navy
    },
    customerNameActive: {
        color: theme.colors.primary
    },
    customerPhone: {
        fontSize: 11,
        color: theme.colors.muted,
        marginTop: 2
    },
    customerDebt: {
        fontSize: 12,
        fontWeight: '800',
        color: '#DC2626'
    },
    customerLimit: {
        fontSize: 10,
        color: theme.colors.muted,
        marginTop: 2
    },
    footer: {
        paddingTop: 8
    }
});
//# sourceMappingURL=MobilePaymentModal.js.map