import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import * as ReactNative from 'react-native';
const Modal = (ReactNative as any).Modal;
import { theme } from '../../theme';
import { Icon } from '../common/Icon';
import { useApp, AppId } from '../../context/AppContext';

interface AppLauncherModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectApp?: (appId: AppId) => void;
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  visible,
  onClose,
  onSelectApp
}) => {
  const { availableApps, activeAppId, switchApp } = useApp();

  const handleSelect = (appId: AppId) => {
    switchApp(appId);
    onSelectApp?.(appId);
    onClose();
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
                <View>
                  <Text style={styles.title}>Application Suites</Text>
                  <Text style={styles.subtitle}>Switch active business application</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={16} color={theme.colors.body} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 16 }}>
                {availableApps.map(app => {
                  const isActive = app.id === activeAppId;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={[styles.item, isActive && styles.itemActive]}
                      onPress={() => handleSelect(app.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                        <Icon
                          name={app.icon}
                          size={20}
                          color={isActive ? theme.colors.primary : theme.colors.body}
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.appName, isActive && styles.appNameActive]}>
                            {app.name}
                          </Text>
                          <View
                            style={[
                              styles.statusPill,
                              app.status === 'active'
                                ? styles.statusActive
                                : app.status === 'ready'
                                ? styles.statusReady
                                : styles.statusPreview
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                app.status === 'active'
                                  ? styles.statusTextActive
                                  : app.status === 'ready'
                                  ? styles.statusTextReady
                                  : styles.statusTextPreview
                              ]}
                            >
                              {app.status === 'active' ? 'Active Suite' : app.status === 'ready' ? 'Ready' : 'Preview'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.appTagline}>{app.tagline}</Text>
                        <Text style={styles.appDesc} numberOfLines={2}>{app.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '75%',
    paddingTop: theme.spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  title: {
    ...theme.typography.h2
  },
  subtitle: {
    ...theme.typography.caption,
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceSubtle
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.sm
  },
  itemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  iconWrapActive: {
    backgroundColor: theme.colors.primaryLight
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  appName: {
    ...theme.typography.bodyBold
  },
  appNameActive: {
    color: theme.colors.primary
  },
  appTagline: {
    fontSize: 12,
    color: theme.colors.body,
    marginTop: 1
  },
  appDesc: {
    ...theme.typography.caption,
    marginTop: 4
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: theme.radii.full
  },
  statusActive: {
    backgroundColor: theme.colors.successBg
  },
  statusReady: {
    backgroundColor: theme.colors.infoBg
  },
  statusPreview: {
    backgroundColor: theme.colors.surfaceSubtle
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700'
  },
  statusTextActive: {
    color: theme.colors.successText
  },
  statusTextReady: {
    color: theme.colors.infoText
  },
  statusTextPreview: {
    color: theme.colors.muted
  }
});
