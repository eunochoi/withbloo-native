import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/Text';
import { useI18n } from '../../i18n/react';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function HomeGreeting() {
  const { t } = useI18n();
  const navigationItems = [
    { label: t('home.emotionTag'), href: '/calendar', a11y: t('home.emotionLink') },
    { label: t('home.habitTag'), href: '/habit', a11y: t('home.habitLink') },
    { label: t('home.soberTag'), href: '/sober', a11y: t('home.soberLink') },
  ] as const;
  const router = useRouter();
  const { rem: appRem } = useAppTheme();

  return (
    <View className="shrink-0 gap-2">
      <Text className="tracking-tight font-bold text-4xl leading-tight">{t('home.greetingFirst')}</Text>
      <Text className="tracking-tight font-bold text-4xl leading-tight">{t('home.greetingSecond')}</Text>
      <View className="mt-1 flex-row flex-wrap items-center gap-1 px-0.5">
        {navigationItems.map(({ label, href, a11y }) => (
          <Pressable
            key={href}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            onPress={() => router.push(href)}
            hitSlop={{ top: appRem * 0.5, bottom: appRem * 0.5 }}
            className="active:opacity-70"
          >
            <Text className="text-theme-accent-deep text-base font-semibold">#{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
