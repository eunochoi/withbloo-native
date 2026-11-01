import { View } from 'react-native';
import { Text } from '../../components/Text';

export function AnalysisSubtitle({ children }: { children: string }) {
  return (
    <View className="mx-1 flex-row items-center gap-2 py-2">
      <View className="h-2 w-2 rounded-full bg-theme-accent" />
      <Text accessibilityRole="header" className="text-base font-normal">
        {children}
      </Text>
    </View>
  );
}
