import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useEffect } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 12,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  children,
}: ProgressRingProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Shared value for smooth animations - initialize with current progress
  const progressValue = useSharedValue(clampedProgress);

  // Update progress value with animation whenever progress changes
  useEffect(() => {
    progressValue.value = withTiming(clampedProgress, {
      duration: 250, // Smooth animation duration (reduced for faster response)
    });
  }, [clampedProgress]);

  // Calculate the stroke for a circular progress
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated props for the circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (progressValue.value * circumference);
    return {
      strokeDashoffset: strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle - animated */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Content in center */}
      {children && (
        <View style={styles.content}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
