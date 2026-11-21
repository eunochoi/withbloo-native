import { ScrollEdgeFade } from '../src/components/ScrollEdgeFade';
import { useScrollFade } from '../src/hooks/useScrollFade';
import { useIsFocused } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { NoticeHost } from '../src/components/NoticeProvider';
import { useI18n } from '../src/i18n/react';
import { SECTION_TITLE_CLASS_NAME, BODY_TEXT_CLASS_NAME } from '../src/theme/classes';
import { SheetHeader } from '../src/components/SheetHeader';
import { ScrollView, View } from 'react-native';
import { Text } from '../src/components/Text';
import { PRIVACY_SECTIONS } from '../src/privacy/content';

export default function Privacy() {
  const sheetFade = useScrollFade();
  const router = useRouter();
  const focused = useIsFocused();
  const { t } = useI18n();
  return (
    <View className="flex-1 px-[5%] pt-2">
      <SheetHeader
        title={t('settings.privacy')}
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/setting'))}
      />
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          className="flex-1"
          contentContainerClassName="gap-7 py-8 pb-12"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-6">
            {PRIVACY_SECTIONS.map((section) => (
              <View key={section} className="gap-3">
                <Text accessibilityRole="header" className={SECTION_TITLE_CLASS_NAME}>
                  {t(`privacy.${section}Title`)}
                </Text>
                <Text className={`px-1 ${BODY_TEXT_CLASS_NAME}`}>
                  {t(`privacy.${section}Text`)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <ScrollEdgeFade edge="top" visible={sheetFade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={sheetFade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>
      <NoticeHost modal active={focused} />
    </View>
  );
}
