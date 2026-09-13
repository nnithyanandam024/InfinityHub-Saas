import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar
} from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../common/Icon';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayMs?: number;
}

const STATUS_STEPS = [
  'Initializing secure store client...',
  'Connecting to retail catalog...',
  'Synchronizing local SKU balances...',
  'Store ready'
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayMs = 1500
}) => {
  const [statusIndex, setStatusIndex] = useState(0);

  // Animation values
  const emblemScale = useRef(new Animated.Value(0.75)).current;
  const emblemOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.9)).current;
  const haloOpacity = useRef(new Animated.Value(0.3)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(14)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance spring on brand emblem
    Animated.parallel([
      Animated.spring(emblemScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true
      }),
      Animated.timing(emblemOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true
      })
    ]).start();

    // 2. Continuous breathing halo pulse
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1.25,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.65,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 0.9,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.3,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ])
    );
    haloLoop.start();

    // 3. Staggered text entrance
    const textTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ]).start();
    }, 150);

    // 4. Progress bar fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDisplayMs - 350,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false
    }).start();

    // 5. Status message steps
    const stepDuration = (minDisplayMs - 400) / (STATUS_STEPS.length - 1);
    const stepInterval = setInterval(() => {
      setStatusIndex(prev => {
        if (prev < STATUS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, stepDuration);

    // 6. Smooth dismiss transition
    const exitTimer = setTimeout(() => {
      haloLoop.stop();
      Animated.parallel([
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 350,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(screenScale, {
          toValue: 1.06,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ]).start(() => {
        if (onFinish) onFinish();
      });
    }, minDisplayMs);

    return () => {
      clearTimeout(textTimer);
      clearInterval(stepInterval);
      clearTimeout(exitTimer);
      haloLoop.stop();
    };
  }, [minDisplayMs, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenFade,
          transform: [{ scale: screenScale }]
        }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Center Brand Identity */}
      <View style={styles.centerGroup}>
        {/* Animated Breathing Halo */}
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }]
            }
          ]}
        />

        {/* Brand Emblem */}
        <Animated.View
          style={[
            styles.emblemContainer,
            {
              opacity: emblemOpacity,
              transform: [{ scale: emblemScale }]
            }
          ]}
        >
          <View style={styles.emblemInner}>
            <Icon name="package" size={32} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Animated Typography */}
        <Animated.View
          style={[
            styles.textGroup,
            {
              opacity: contentFade,
              transform: [{ translateY: contentTranslate }]
            }
          ]}
        >
          <Text style={styles.brandTitle}>InfinityHub</Text>
          <Text style={styles.brandSubtitle}>Retail & Inventory Platform</Text>

          <View style={styles.clientBadge}>
            <View style={styles.clientDot} />
            <Text style={styles.clientText}>Dedicated Store Client</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Progress & Status Ticker */}
      <Animated.View
        style={[
          styles.bottomGroup,
          {
            opacity: contentFade,
            transform: [{ translateY: contentTranslate }]
          }
        ]}
      >
        <View style={styles.trackContainer}>
          <Animated.View style={[styles.trackFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.statusText}>{STATUS_STEPS[statusIndex]}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  centerGroup: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  halo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.35)'
  },
  emblemContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    marginBottom: 20
  },
  emblemInner: {
    flex: 1,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textGroup: {
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6
  },
  clientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  clientText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0'
  },
  bottomGroup: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40
  },
  trackContainer: {
    width: '100%',
    maxWidth: 220,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    marginBottom: 12
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2
  }
});
