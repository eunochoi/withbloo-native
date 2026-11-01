import { View } from 'react-native';
import { Text } from '../../components/Text';
import { useI18n } from '../../i18n/react';
import { OnboardingFrame } from './OnboardingFrame';
import {
  sectionClassName,
  sectionTitleClassName,
  sectionContentClassName,
  sectionTextClassName,
  exampleClassName,
} from './styles';
import { Image } from 'react-native';
import { ArrowsLeftRightIcon } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { useAppTheme } from '../../theme/AppThemeProvider';
const navigationPreview = require('../../../assets/onboarding/navigation.png');
const navigationSize = Image.resolveAssetSource(navigationPreview);
function ViewToggleExample({ leftText, rightText }: { leftText: string; rightText: string }) {
  const { colors, rem } = useAppTheme();
  return (
    <View
      accessibilityLabel={`${leftText} / ${rightText}`}
      className={`${exampleClassName} items-center justify-between`}
    >
      <Text className="flex-1 text-center text-base font-semibold">{leftText}</Text>
      <ArrowsLeftRightIcon size={rem * 1.125} color={colors.textTertiary} weight="bold" />
      <Text className="flex-1 text-center text-base font-semibold">{rightText}</Text>
    </View>
  );
}
export function UsagePage() {
  const { t } = useI18n();
  return (
    <OnboardingFrame
      title={t('onboarding.usageTitle')}
      description={t('onboarding.usageDescription')}
    >
      <View className={sectionClassName}>
        <Text className={sectionTitleClassName}>{t('onboarding.tapAgain')}</Text>
        <View className={sectionContentClassName}>
          <Image
            source={navigationPreview}
            accessibilityLabel={t('onboarding.navigationImage')}
            resizeMode="contain"
            className="w-full"
            style={{ height: 'auto', aspectRatio: navigationSize.width / navigationSize.height }}
          />
          <Text className={sectionTextClassName}>{t('onboarding.tapDescription')}</Text>
        </View>
      </View>
      <View className={sectionClassName}>
        <Text className={sectionTitleClassName}>{t('onboarding.durationTitle')}</Text>
        <View className={sectionContentClassName}>
          <ViewToggleExample
            leftText={t('onboarding.durationLeft')}
            rightText={t('onboarding.durationRight')}
          />
          <Text className={sectionTextClassName}>{t('onboarding.durationDescription')}</Text>
        </View>
      </View>
      <View className={sectionClassName}>
        <Text className={sectionTitleClassName}>{t('onboarding.longNameTitle')}</Text>
        <View className={sectionContentClassName}>
          <ViewToggleExample
            leftText={t('onboarding.longNameLeft')}
            rightText={t('onboarding.longNameRight')}
          />
          <Text className={sectionTextClassName}>{t('onboarding.longNameDescription')}</Text>
        </View>
      </View>
    </OnboardingFrame>
  );
}
