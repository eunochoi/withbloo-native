import type { ReactNode } from 'react';
import { View } from 'react-native';

export function PickerInfoCard({ children }: { children: ReactNode }) {
  return (
    <View className="min-h-32 flex-row items-center gap-3 rounded-2xl border border-theme-accent/20 bg-theme-accent/10 p-4">
      {children}
    </View>
  );
}
