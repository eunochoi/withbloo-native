import { Image, Linking, Pressable, View } from 'react-native';
import { useI18n } from '../../i18n/react';
import { Text } from '../../components/Text';
import { AppIcon } from '../../components/AppIcon';
import { useNotice } from '../../components/NoticeProvider';
import { Wordmark } from '../../components/Wordmark';
const standingCat = require('../../../assets/cats/cat-blue-standing.png');
const dimensions = Image.resolveAssetSource(standingCat);
export function StartPage() {
  const { t } = useI18n();
  const { showNotice } = useNotice();
  return (
    <View className="w-full grow justify-evenly items-center gap-4 px-6 py-6">
      <Text accessibilityRole="header" className="text-center text-3xl font-semibold">
        {t('onboarding.startTitle')}
      </Text>
      <View className="w-full items-center gap-2">
        <Text className="text-center text-lg text-theme-text-secondary">
          {t('onboarding.startLine1')}
        </Text>
        <Text className="text-center text-lg text-theme-text-secondary">
          {t('onboarding.startLine2')}
        </Text>
      </View>
      <View className="w-full items-center gap-4">
        <Image
          source={standingCat}
          accessible={false}
          resizeMode="contain"
          className="w-2/3 max-w-[300px]"
          style={{ height: 'auto', aspectRatio: dimensions.width / dimensions.height }}
        />
        <Wordmark size={36 * 1.35} />
      </View>
      <View className="w-full items-center gap-2">
        <Text className="text-center text-lg text-theme-text-secondary">
          {t('onboarding.startSummary')}
        </Text>
        <Text className="mt-2 text-center text-base text-theme-accent-deep">
          {t('onboarding.brandTagline')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL('https://to-ok.me').catch(() =>
            showNotice({ tone: 'error', title: t('onboarding.webFailed') }),
          );
        }}
        className="min-h-12 flex-row items-center gap-2 rounded-xl"
      >
        <Text className="text-base text-theme-text-secondary/75">{t('onboarding.browseWeb')}</Text>
        <AppIcon name="arrow-forward" className="text-theme-text-secondary" />
      </Pressable>
    </View>
  );
}
