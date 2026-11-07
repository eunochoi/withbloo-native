import Animated from 'react-native-reanimated';
import { useAppTheme } from '../theme/AppThemeProvider';

export function PageIndicator({ active, color, className = '' }: {
  active: boolean;
  color?: string;
  className?: string;
}) {
  const { rem, reducedMotion } = useAppTheme();
  return (
    <Animated.View
      className={`h-2 ios:curve-continuous rounded-full ${color ? '' : 'bg-theme-accent'} ${className}`}
      style={{
        ...(color ? { backgroundColor: color } : {}),
        width: rem * (active ? 1.25 : 0.5),
        opacity: active ? 1 : 0.25,
        transitionProperty: ['width', 'opacity'],
        transitionDuration: reducedMotion ? '0ms' : '400ms',
      }}
    />
  );
}
