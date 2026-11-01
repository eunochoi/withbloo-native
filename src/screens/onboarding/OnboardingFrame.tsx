import type { ReactNode } from 'react';
import { View } from 'react-native';
import { InfoNotice } from '../../components/InfoNotice';
import { Text } from '../../components/Text';

export function OnboardingFrame({
  title,
  description,
  info,
  children,
}: {
  title: string;
  description: string;
  info?: string;
  children: ReactNode;
}) {
  return (
    <View className="w-full max-w-lg grow self-center gap-12 px-6 py-6">
      <View className="shrink-0 gap-2">
        <Text
          accessibilityRole="header"
          className="text-center text-2xl font-semibold leading-7 tracking-tight"
        >
          {title}
        </Text>
        <Text className="text-center text-base text-theme-text-secondary">{description}</Text>
      </View>
      <View className="shrink-0 gap-8">
        {children}
        {info && (
          <InfoNotice textClassName="text-xs" adjustsFontSizeToFit={false} numberOfLines={0}>
            {info}
          </InfoNotice>
        )}
      </View>
    </View>
  );
}
