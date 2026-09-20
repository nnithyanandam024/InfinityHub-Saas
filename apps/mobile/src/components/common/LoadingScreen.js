import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { theme } from '../../theme';
import { Icon } from './Icon';
export const LoadingScreen = ({ message = 'Loading Store Data...', subMessage = 'Synchronizing real-time catalog and stock balances', fullScreen = true, overlay = false, icon = 'package' }) => {
    const pulseAnim = useRef(new Animated.Value(0.95)).current;
    const opacityAnim = useRef(new Animated.Value(0.4)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const pulseLoop = Animated.loop(Animated.sequence([
            Animated.parallel([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.15,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                })
            ]),
            Animated.parallel([
                Animated.timing(pulseAnim, {
                    toValue: 0.95,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.45,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                })
            ])
        ]));
        pulseLoop.start();
        const rotateLoop = Animated.loop(Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true
        }));
        rotateLoop.start();
        return () => {
            pulseLoop.stop();
            rotateLoop.stop();
        };
    }, []);
    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });
    const content = (<View style={styles.card}>
      {/* Concentric Pulsing Rings & Floating Badge */}
      <View style={styles.animationArea}>
        <Animated.View style={[
            styles.outerPulseRing,
            {
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim
            }
        ]}/>

        <Animated.View style={[
            styles.orbitRing,
            {
                transform: [{ rotate: spin }]
            }
        ]}>
          <View style={styles.orbitDot}/>
        </Animated.View>

        <View style={styles.innerBadge}>
          <Icon name={icon} size={24} color={theme.colors.primary}/>
        </View>
      </View>

      {/* Status Typography */}
      <Text style={styles.messageText}>{message}</Text>
      {subMessage ? <Text style={styles.subMessageText}>{subMessage}</Text> : null}

      <View style={styles.statusPill}>
        <View style={styles.statusPillDot}/>
        <Text style={styles.statusPillText}>Connecting</Text>
      </View>
    </View>);
    if (overlay) {
        return (<View style={styles.overlayContainer}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(15, 23, 42, 0.6)"/>
        {content}
      </View>);
    }
    if (fullScreen) {
        return (<View style={styles.fullScreenContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC"/>
        {content}
      </View>);
    }
    return <View style={styles.inlineContainer}>{content}</View>;
};
const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24
    },
    inlineContainer: {
        minHeight: 180,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.radii.lg,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        width: '100%',
        maxWidth: 320,
        ...theme.shadows.card
    },
    animationArea: {
        width: 84,
        height: 84,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18
    },
    outerPulseRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primaryTint
    },
    orbitRing: {
        position: 'absolute',
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: 'transparent',
        borderTopColor: theme.colors.primary,
        borderRightColor: theme.colors.primary
    },
    orbitDot: {
        position: 'absolute',
        top: 0,
        right: 14,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary
    },
    innerBadge: {
        width: 48,
        height: 48,
        borderRadius: theme.radii.md,
        backgroundColor: '#F0F7FF',
        borderWidth: 1,
        borderColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center'
    },
    messageText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.navy,
        textAlign: 'center',
        marginBottom: 6
    },
    subMessageText: {
        fontSize: 12,
        color: theme.colors.body,
        textAlign: 'center',
        lineHeight: 17,
        marginBottom: 14
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceSubtle,
        borderRadius: theme.radii.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6
    },
    statusPillDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    }
});
//# sourceMappingURL=LoadingScreen.js.map