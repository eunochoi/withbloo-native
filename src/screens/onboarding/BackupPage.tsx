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
import { Wordmark } from '../../components/Wordmark';
export function BackupPage() {
  const { t } = useI18n();
  return (
    <OnboardingFrame
      title={t('onboarding.backupTitle')}
      description={t('onboarding.backupDescription')}
      info={t('onboarding.backupNotice')}
    >
      <View className={sectionClassName}>
        <Text className={sectionTitleClassName}>{t('onboarding.webTitle')}</Text>
        <View className={sectionContentClassName}>
          <View className={`${exampleClassName} items-center justify-center gap-4`}>
            <Wordmark size={36 * 1.35} />
            <Text className="text-2xl font-semibold">-</Text>
            <Text className="text-2xl font-semibold">Web</Text>
          </View>
          <Text className={sectionTextClassName}>{t('onboarding.webDescription')}</Text>
          <Text className={sectionTextClassName}>{t('onboarding.webBackupDescription')}</Text>
        </View>
      </View>
      <View className={sectionClassName}>
        <Text className={sectionTitleClassName}>{t('onboarding.localTitle')}</Text>
        <View className={sectionContentClassName}>
          <View className={`${exampleClassName} items-center justify-center gap-4`}>
            <Wordmark size={36 * 1.35} />
            <Text className="text-2xl font-semibold">-</Text>
            <Text className="text-2xl font-semibold">App</Text>
          </View>
          <Text className={sectionTextClassName}>{t('onboarding.localDescription')}</Text>
          <Text className={sectionTextClassName}>{t('onboarding.localBackupDescription')}</Text>
        </View>
      </View>
      <View className={sectionClassName}>
        <Text className={sectionTitleClassName}>{t('onboarding.backupRestore')}</Text>
        <View className={sectionContentClassName}>
          <Text className={sectionTextClassName}>{t('onboarding.passwordDescription')}</Text>
          <Text className={sectionTextClassName}>{t('onboarding.backupSizeDescription')}</Text>
        </View>
      </View>
    </OnboardingFrame>
  );
}
