import { PropsWithChildren, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

export function AnimatedEntrance({ children }: PropsWithChildren) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    let animation: Animated.CompositeAnimation | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) return;
      if (reduceMotion) {
        progress.setValue(1);
        return;
      }

      animation = Animated.spring(progress, {
        damping: 18,
        mass: 0.8,
        stiffness: 170,
        toValue: 1,
        useNativeDriver: true,
      });
      animation.start();
    });

    return () => {
      isMounted = false;
      animation?.stop();
    };
  }, [progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{
          translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
        }],
      }}
    >
      {children}
    </Animated.View>
  );
}
