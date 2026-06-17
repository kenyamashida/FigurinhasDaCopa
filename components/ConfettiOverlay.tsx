import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, runOnJS } from 'react-native-reanimated';

// Since we can't easily install a complex confetti library right now without user intervention, 
// we will build a simple CSS-like particle system using Reanimated.

interface ParticleProps {
  index: number;
}

const Particle = ({ index }: ParticleProps) => {
  const top = useSharedValue(-50);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  const colors = ['#E61D25', '#0A2540', '#F1C40F', '#2ECC71', '#9B59B6'];
  const color = colors[index % colors.length];
  const size = 10 + Math.random() * 10;
  const startLeft = Math.random() * 100;
  
  useEffect(() => {
    const delay = Math.random() * 500;
    const duration = 2000 + Math.random() * 1000;
    
    top.value = withDelay(delay, withTiming(800, { duration, easing: Easing.linear }));
    opacity.value = withDelay(delay + duration * 0.8, withTiming(0, { duration: duration * 0.2 }));
    rotate.value = withDelay(delay, withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration, easing: Easing.linear }));
  }, []);

  const style = useAnimatedStyle(() => ({
    top: top.value,
    opacity: opacity.value,
    transform: [{ rotate: `${rotate.value}deg` }]
  }));

  return (
    <Animated.View style={[styles.particle, { backgroundColor: color, width: size, height: size, left: `${startLeft}%` }, style]} />
  );
};

export default function ConfettiOverlay({ active, onComplete }: { active: boolean, onComplete?: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!show) return null;

  return (
    <Animated.View style={styles.container} pointerEvents="none">
      {Array.from({ length: 50 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  }
});
