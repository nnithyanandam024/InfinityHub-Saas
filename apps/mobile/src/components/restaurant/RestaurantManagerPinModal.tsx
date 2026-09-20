import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface RestaurantManagerPinModalProps {
  visible: boolean;
  actionTitle: string;
  actionDescription: string;
  requireReason?: boolean;
  onClose: () => void;
  onAuthorized: (pin: string, reason: string, managerName: string) => Promise<void>;
}

export const RestaurantManagerPinModal: React.FC<RestaurantManagerPinModalProps> = ({
  visible,
  actionTitle,
  actionDescription,
  requireReason = true,
  onClose,
  onAuthorized
}) => {
  const [pin, setPin] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('Manager Vikram');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setPin('');
      setReason('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setErrorMessage('Please enter 4-digit security PIN.');
      return;
    }
    if (requireReason && !reason.trim()) {
      setErrorMessage('Please specify an operational audit reason.');
      return;
    }
    if (pin !== '1234') {
      setErrorMessage('Invalid Manager PIN. Authorization failed.');
      setPin('');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAuthorized(pin, reason.trim(), managerName);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authorization rejected.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.securityHeader}>
                  <Icon name="shield" size={16} color={theme.colors.danger} />
                  <Text style={styles.securityTag}>Manager Authorization Required</Text>
                </View>
                <Text style={styles.title}>{actionTitle}</Text>
                <Text style={styles.subtitle}>{actionDescription}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={16} color={theme.colors.body} />
              </TouchableOpacity>
            </View>

            {/* PIN Indicator Dots */}
            <View style={styles.dotsContainer}>
              {[0, 1, 2, 3].map(idx => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    pin.length > idx && styles.dotFilled,
                    errorMessage ? styles.dotError : null
                  ]}
                />
              ))}
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Optional Reason Input */}
            {requireReason && (
              <View style={styles.reasonSection}>
                <Text style={styles.inputLabel}>Operational Reason</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Guest changed mind / AC too cold"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            )}

            {/* Custom Numeric Keypad */}
            <View style={styles.keypad}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['C', '0', '<']
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map(key => {
                    if (key === 'C') {
                      return (
                        <TouchableOpacity
                          key={key}
                          style={styles.keyBtnAux}
                          onPress={() => setPin('')}
                        >
                          <Text style={styles.keyTextAux}>Clear</Text>
                        </TouchableOpacity>
                      );
                    }
                    if (key === '<') {
                      return (
                        <TouchableOpacity
                          key={key}
                          style={styles.keyBtnAux}
                          onPress={handleBackspace}
                        >
                          <Text style={styles.keyTextAux}>Del</Text>
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.keyBtn}
                        onPress={() => handleDigitPress(key)}
                      >
                        <Text style={styles.keyText}>{key}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Submit Action */}
            <View style={styles.actions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                label={isSubmitting ? 'Verifying...' : 'Authorize Action'}
                variant="danger"
                onPress={handleSubmit}
                disabled={isSubmitting || pin.length !== 4}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    padding: theme.spacing.xl,
    paddingBottom: 32
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  securityTag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.danger,
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.navy
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 14
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent'
  },
  dotFilled: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy
  },
  dotError: {
    borderColor: theme.colors.danger
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 8
  },
  reasonSection: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.body,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.navy,
    backgroundColor: theme.colors.background
  },
  keypad: {
    gap: 8,
    marginBottom: 16
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  keyBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.navy
  },
  keyBtnAux: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyTextAux: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.body
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  }
});
