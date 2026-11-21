import { ScrollableName } from '../../../src/components/ScrollableName';
import { formatDisplayDate } from '../../../src/i18n/format';
import { useI18n } from '../../../src/i18n/react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../../src/components/AppIcon';
import { SheetHeader } from '../../../src/components/SheetHeader';
import { EmotionImage } from '../../../src/components/EmotionImage';
import { HabitIcon } from '../../../src/components/HabitIcon';
import { NoticeHost } from '../../../src/components/NoticeProvider';
import { QueryState } from '../../../src/components/QueryState';
import { ScrollEdgeFade } from '../../../src/components/ScrollEdgeFade';
import { Text } from '../../../src/components/Text';
import { EMOTIONS } from '../../../src/domain/constants';
import { useScrollFade } from '../../../src/hooks/useScrollFade';
import { diaryQueries, useToday } from '../../../src/queries';
import { DiaryGallery } from '../../../src/screens/diary/DiaryGallery';
import { DiaryMenu } from '../../../src/screens/diary/DiaryMenu';
import { useAppTheme } from '../../../src/theme/AppThemeProvider';

export default function DiaryDetail() {
  const { t, formatLocale } = useI18n();

  const { colors, rem: appRem, iconSizes } = useAppTheme();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const focused = useIsFocused();
  const fade = useScrollFade();
  const insets = useSafeAreaInsets();

  const query = useQuery(diaryQueries.byId(db, Number(id)));
  const diary = query.data;
  const title = diary ? formatDisplayDate(diary.date, formatLocale, 'long') : t('diary.title');
  return (
    <View className="flex-1 px-[5%] pt-2">
      <SheetHeader
        title={title}
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/diary'))}
        menuAction={
          diary ? (
            <DiaryMenu diary={diary} today={today} onDeleted={() => router.dismissTo('/diary')} />
          ) : undefined
        }
      />
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <ScrollView
          key={id}
          className="flex-1"
          contentContainerClassName="gap-12 py-8"
          contentContainerStyle={{ paddingBottom: Math.max(appRem * 2, insets.bottom) }}
          onScroll={fade.onScroll}
          onLayout={fade.onLayout}
          onContentSizeChange={fade.onContentSizeChange}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <QueryState query={query} />
          {diary ? (
            <>
              <View className="gap-6">
                <View className="flex-row items-center gap-5">
                  <EmotionImage emotion={diary.emotion} size={appRem * 3.5} />
                  <View>
                    <Text className="text-sm font-bold text-theme-accent">
                      {t('diary.todayEmotion')}
                    </Text>
                    <Text className="mt-1 font-bold text-xl font-medium text-theme-text-primary">
                      {t(`emotions.${(EMOTIONS[diary.emotion] ?? EMOTIONS[9]).key}`)}
                    </Text>
                  </View>
                </View>
                {diary.completedHabits.length > 0 && (
                  <View className="flex-row flex-wrap gap-x-4 gap-y-2 px-1">
                    {diary.completedHabits.map((habit) => (
                      <View
                        key={habit.id}
                        accessibilityLabel={habit.name}
                        className="max-w-full flex-row items-center gap-1"
                      >
                        <HabitIcon
                          name={habit.icon_key}
                          size={iconSizes.sm}
                          colorKey={habit.icon_color}
                        />
                        <View className="min-w-0 shrink">
                          <ScrollableName className="text-sm text-theme-text-secondary">
                            {habit.name}
                          </ScrollableName>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <Text className="py-2 px-1 text-base leading-[1.9]">{diary.text}</Text>
              </View>
              {diary.images.length > 0 && (
                <View>
                  <View className="mb-4 flex-row items-center gap-2">
                    <AppIcon name="image" size={appRem * 1.125} color={colors.accentText} />
                    <Text className="text-sm text-theme-text-secondary">{t('diary.scenes')}</Text>
                  </View>
                  <DiaryGallery
                    key={diary.images.map((image) => image.file_name).join(',')}
                    images={diary.images}
                    detail
                  />
                </View>
              )}
            </>
          ) : !query.isPending && !query.error ? (
            <Text>{t('diary.notFound')}</Text>
          ) : null}
        </ScrollView>
        <ScrollEdgeFade edge="top" visible={fade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={fade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>
      <NoticeHost modal active={focused} />
    </View>
  );
}
