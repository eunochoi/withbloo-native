import { useIsFocused } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { NoticeHost } from '../src/components/NoticeProvider';
import { useI18n } from '../src/i18n/react';
import { View, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SheetHeader } from '../src/components/SheetHeader';
import { mediaUri, validFileName } from '../src/media';
import { Text } from '../src/components/Text';
export default function ImageScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const { file } = useLocalSearchParams<{ file: string }>();
  return (
    <View className="flex-1 px-[5%] pt-2">
      <SheetHeader
        title={t('ui.photoTitle')}
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-7 py-8 pb-12"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {file && validFileName(file) ? (
            <Image
              source={{ uri: mediaUri(file) }}
              resizeMode="contain"
              className="w-full"
              style={{ height: height * 0.65 }}
              accessibilityLabel={t('ui.diaryPhoto')}
            />
          ) : (
            <Text>{t('errors.photoMissing')}</Text>
          )}
        </ScrollView>
      </View>
      <NoticeHost modal active={focused} />
    </View>
  );
}
