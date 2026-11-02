import { View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { EmotionImage } from '../../components/EmotionImage';
import { Text } from '../../components/Text';
import { useI18n } from '../../i18n/react';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { OnboardingFrame } from './OnboardingFrame';
import {
  exampleClassName,
  sectionClassName,
  sectionContentClassName,
  sectionTextClassName,
  sectionTitleClassName,
} from './styles';
export function CalendarGuidePage() {
  const { t } = useI18n();
  const { rem } = useAppTheme();
  return (
    <OnboardingFrame
      title={t('onboarding.calendarTitle')}
      description={t('onboarding.calendarDescription')}
    >
      <View className={sectionClassName}>
        <Text autoLineHeight className={sectionTitleClassName}>{t('onboarding.emotionTitle')}</Text>
        <View className={sectionContentClassName}>
          <View className={`${exampleClassName} justify-evenly`}>
            {[0, 3, 1, 6].map((emotion) => (
              <View key={emotion} className="h-16 min-w-0 flex-1">
                <EmotionImage emotion={emotion} size={rem * 4} fill />
              </View>
            ))}
          </View>
          <Text autoLineHeight className={sectionTextClassName}>{t('onboarding.emotionDescription')}</Text>
        </View>
      </View>
      <View className={sectionClassName}>
        <Text autoLineHeight className={sectionTitleClassName}>{t('onboarding.progressTitle')}</Text>
        <View className={sectionContentClassName}>
          <View className={`${exampleClassName} justify-evenly gap-4`}>
            {(
              [
                { label: 'lowBand', percent: 20, color: '#E599A5' },
                { label: 'mediumBand', percent: 50, color: '#EFBE48' },
                { label: 'highBand', percent: 100, color: '#7BBDAD' },
              ] as const
            ).map((item) => (
              <View key={item.label} className="min-w-0 flex-1 gap-4">
                <Text autoLineHeight className="text-center text-[13px] text-theme-text-secondary">
                  {t(`onboarding.${item.label}`)}
                </Text>
                <View className="h-4 overflow-hidden rounded-full bg-theme-border/30">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </View>
              </View>
            ))}
          </View>
          <Text autoLineHeight className={sectionTextClassName}>{t('onboarding.progressDescription')}</Text>
        </View>
      </View>
      <View className={sectionClassName}>
        <Text autoLineHeight className={sectionTitleClassName}>{t('onboarding.toolbarNumbers')}</Text>
        <View className={sectionContentClassName}>
          <View className={`${exampleClassName} justify-evenly`}>
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="diary" size={rem * 1.25} className="text-theme-accent" />
              <Text autoLineHeight className="text-[13px]">{t('calendar.entryNumber', { count: 12 })}</Text>
            </View>
            {[
              { count: 8, color: '#7BBDAD' },
              { count: 5, color: '#EFBE48' },
              { count: 2, color: '#E599A5' },
            ].map((item) => (
              <View key={item.color} className="flex-row items-center gap-1.5">
                <AppIcon name="habit" size={rem * 1.25} color={item.color} />
                <Text autoLineHeight className="text-[13px]">
                  {t('calendar.compactDayCount', { count: item.count })}
                </Text>
              </View>
            ))}
          </View>
          <Text autoLineHeight className={sectionTextClassName}>{t('onboarding.toolbarDescription')}</Text>
        </View>
      </View>
    </OnboardingFrame>
  );
}
