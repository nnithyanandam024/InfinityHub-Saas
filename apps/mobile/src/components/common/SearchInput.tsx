import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Icon } from './Icon';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onScanPress?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  onScanPress
}) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={16} color={theme.colors.muted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <Icon name="close" size={14} color={theme.colors.body} />
        </TouchableOpacity>
      ) : onScanPress ? (
        <TouchableOpacity
          onPress={onScanPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.scanBtn}
          accessibilityLabel="Scan barcode to search"
        >
          <Icon name="barcode" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.card,
    paddingHorizontal: 14,
    height: 44,
    ...theme.shadows.subtle
  },
  icon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.navy,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  },
  scanBtn: {
    padding: 6,
    backgroundColor: theme.colors.primaryTint,
    borderRadius: theme.radii.sm
  }
});
