import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../../i18n/react';
import { Text } from '../../components/Text';

const moods = [
  { key: 'positive', image: require('../../../assets/cats/cat-blue-p.png'), color: '#EDA5B1' },
  { key: 'neutral', image: require('../../../assets/cats/cat-blue.png'), color: '#979FC7' },
  { key: 'negative', image: require('../../../assets/cats/cat-blue-n.png'), color: '#8CADE2' },
] as const;
export function WelcomePage() {
  const { t } = useI18n();
  const [mood, setMood] = useState(1);
  return (
    <View className="w-full max-w-lg grow self-center justify-evenly gap-6 px-6 py-6">
      <View className="shrink-0 gap-1 items-center">
        <Text
          accessibilityRole="header"
          className="mb-4 text-center text-3xl font-semibold tracking-tight"
        >
          {t('onboarding.welcomeTitle')}
        </Text>
        <Text className="text-center text-base text-theme-text-secondary">
          {t('onboarding.welcomeLine1')}
        </Text>
        <Text className="text-center text-base text-theme-text-secondary">
          {t('onboarding.welcomeLine2')}
        </Text>
      </View>
      <View className="gap-4">
        <View className="relative h-20 w-full max-w-[21rem] self-center items-center justify-center px-6 pb-4">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 320 88"
            preserveAspectRatio="none"
            accessible={false}
            style={{ position: 'absolute' }}
          >
            <Path
              d="M42 4 C21 3 7 14 7 35 C6 56 20 69 43 70 C77 72 67 71 98 71 C102 78 111 83 124 82 C116 77 113 73 114 71 C157 73 242 72 277 69 C301 67 315 55 314 35 C314 14 299 5 276 4 C203 1 115 2 42 4 Z"
              fill={moods[mood].color}
              fillOpacity={0.2}
            />
          </Svg>
          <Text accessibilityLiveRegion="polite" className="text-center text-base">
            {t(`onboarding.${moods[mood].key}Story`)}
          </Text>
        </View>
        <Image
          key={mood}
          source={moods[mood].image}
          accessibilityLabel={t('onboarding.moodImage', {
            value: t(`onboarding.${moods[mood].key}`),
          })}
          resizeMode="contain"
          className="-mt-8 h-48 w-full max-w-[21rem] self-center"
          fadeDuration={0}
        />
        <View className="flex-row gap-2">
          {moods.map((item, index) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.moodPreview', {
                value: t(`onboarding.${item.key}`),
              })}
              accessibilityState={{ selected: mood === index }}
              onPress={() => setMood(index)}
              className={`min-h-11 min-w-0 flex-1 flex-row flex-wrap items-center justify-center gap-2 rounded-xl border px-2 py-2 ${mood === index ? 'border-theme-accent bg-theme-accent-light/50' : 'border-transparent'}`}
            >
              <View
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <Text
                className={`text-base ${mood === index ? 'font-semibold text-theme-accent-text' : 'text-theme-text-primary'}`}
              >
                {t(`onboarding.${item.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="items-center gap-1">
        <Text className="mb-2 text-center text-xl font-semibold leading-7">
          {t('onboarding.everyColor')}
        </Text>
        <Text className="text-center text-base text-theme-text-secondary">
          {t('onboarding.welcomeSummaryLine1')}
        </Text>
        <Text className="text-center text-base text-theme-text-secondary">
          {t('onboarding.welcomeSummaryLine2')}
        </Text>
        <Text className="mt-2 text-center text-base text-theme-accent-deep">
          {t('onboarding.brandTagline')}
        </Text>
      </View>
    </View>
  );
}
