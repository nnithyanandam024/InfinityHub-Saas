import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
const APPS_LIST = [
    {
        id: 'inventory',
        name: 'Inventory Management',
        tagline: 'Precision Stock Control & Supply Chain',
        desc: 'SKU catalogs, warehouse stock, low-stock alerts, barcode scanner studio, and physical count audit.',
        status: 'active',
        pricing: 'Active Subscription'
    },
    {
        id: 'pos',
        name: 'Billing & POS',
        tagline: 'Rapid Retail Checkout & Invoicing',
        desc: 'Barcode checkout, digital receipts, cash register reconciliation, and split payment collection.',
        status: 'ready',
        pricing: 'Included in Plan'
    },
    {
        id: 'restaurant',
        name: 'Restaurant Suite',
        tagline: 'Dine-In, Kitchen Display & Table Operations',
        desc: 'Visual table management, kitchen display screen, digital menus, and ingredient recipe costings.',
        status: 'preview',
        pricing: 'Add-on Suite'
    },
    {
        id: 'employee',
        name: 'Employee & Attendance',
        tagline: 'Workforce Roster & Shifts',
        desc: 'Clock-in attendance, employee shifts, salary slips, and store team permissions.',
        status: 'preview',
        pricing: 'Add-on Suite'
    }
];
export const AppCatalogScreen = ({ navigation }) => {
    const { switchApp } = useApp();
    const handleLaunch = (id) => {
        if (id === 'pos') {
            switchApp('pos');
            navigation.navigate('PosPreview');
        }
        else if (id === 'inventory') {
            switchApp('inventory');
            navigation.navigate('Dashboard');
        }
    };
    return (<SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevronRight" size={16} color={theme.colors.navy} style={{ transform: [{ rotate: '180deg' }] }}/>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Marketplace</Text>
        <View style={{ width: 32 }}/>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Business Application Suites</Text>
        <Text style={styles.sectionSubtitle}>
          Modular applications tailored to specific business operations:
        </Text>

        {APPS_LIST.map(app => (<View key={app.id} style={styles.appCard}>
            <View style={styles.appCardHeader}>
              <View style={styles.appTitleWrap}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appTagline}>{app.tagline}</Text>
              </View>
              <Badge label={app.status === 'active' ? 'Active' : app.status === 'ready' ? 'Ready' : 'Preview'} variant={app.status === 'active' ? 'success' : app.status === 'ready' ? 'primary' : 'muted'} size="sm"/>
            </View>

            <Text style={styles.appDesc}>{app.desc}</Text>

            <View style={styles.appCardFooter}>
              <Text style={styles.pricingText}>{app.pricing}</Text>
              {app.status === 'active' ? (<Button label="Open Suite" onPress={() => handleLaunch(app.id)} variant="primary" size="sm"/>) : app.status === 'ready' ? (<Button label="Launch POS" onPress={() => handleLaunch(app.id)} variant="secondary" size="sm"/>) : (<Button label="Learn More" onPress={() => { }} variant="outline" size="sm"/>)}
            </View>
          </View>))}
      </ScrollView>
    </SafeAreaView>);
};
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
    },
    backBtn: {
        width: 32,
        height: 32,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.navy
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: 40
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.navy
    },
    sectionSubtitle: {
        fontSize: 12,
        color: theme.colors.body,
        marginTop: 2,
        marginBottom: theme.spacing.md
    },
    appCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        marginBottom: 12,
        ...theme.shadows.card
    },
    appCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    appTitleWrap: {
        flex: 1,
        marginRight: 8
    },
    appName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.navy
    },
    appTagline: {
        fontSize: 11,
        color: theme.colors.body,
        marginTop: 2
    },
    appDesc: {
        fontSize: 12,
        color: theme.colors.body,
        marginVertical: 10,
        lineHeight: 17
    },
    appCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.surfaceSubtle
    },
    pricingText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.muted
    }
});
//# sourceMappingURL=AppCatalogScreen.js.map