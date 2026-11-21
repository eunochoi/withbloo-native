import { ScrollEdgeFade } from '../../components/ScrollEdgeFade';
import { useScrollFade } from '../../hooks/useScrollFade';
import { AnimatedScrollView } from '../../components/AnimatedScrollView';
import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions, type ScrollView } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from '../../components/HeaderAction';
import { EmotionImage } from '../../components/EmotionImage';
import { PickerOption } from '../../components/PickerOption';
import { PickerInfoCard } from '../../components/PickerInfoCard';
import { Text } from '../../components/Text';
import { DotTabs } from '../../components/DotTabs';
import { EMOTIONS } from '../../domain/constants';
import { DIARY_EMOTION_GROUPS, type DiaryEmotionGroup } from '../../domain/diaryFilters';
import { useAppTheme } from '../../theme/AppThemeProvider';

const categories = ['positive', 'neutral', 'negative'] as const;
const representativeEmotions: Record<DiaryEmotionGroup, number> = {
  positive: 0,
  neutral: 11,
  negative: 6,
};

export function DiaryEmotionPicker({
  value,
  allowDeselect = false,
  onClose,
  onApply,
}: {
  value: number | null;
  allowDeselect?: boolean;
  onClose: () => void;
  onApply: (value: number | null) => void;
}) {
  const sheetFade = useScrollFade();
  const { t } = useI18n();

  const { rem: appRem } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const [draft, setDraft] = useState(value);
  const [categoryId, setCategoryId] = useState<DiaryEmotionGroup>(
    () =>
      categories.find(
        (id) =>
          value !== null &&
          (DIARY_EMOTION_GROUPS[id].emotions as readonly number[]).includes(value),
      ) ?? 'positive',
  );
  const category = DIARY_EMOTION_GROUPS[categoryId];
  const emotionIds: readonly number[] = category.emotions;
  const columns = 2;
  const rows = Array.from({ length: Math.ceil(emotionIds.length / columns) }, (_, row) =>
    emotionIds.slice(row * columns, (row + 1) * columns),
  );
  const contentKey = `${categoryId}-${columns}`;
  const scrollRef = useAnimatedRef<ScrollView>();
  const opened = useRef(false);
  const initialScrollPending = useRef(true);
  const initialRowY = useRef<number | null>(null);
  const gridY = useRef(0);

  function revealInitialSelection() {
    if (
      opened.current &&
      initialScrollPending.current &&
      initialRowY.current !== null &&
      scrollRef.current
    ) {
      scrollRef.current.scrollTo({
        y: Math.max(0, gridY.current + initialRowY.current - appRem),
        animated: true,
      });
      initialScrollPending.current = false;
    }
  }

  const topContent = (
    <View className="shrink-0 gap-4 pt-8 pb-4">
      <DotTabs
        options={categories.map((id) => ({
          value: id,
          label: t(`diary.${id}`),
          accessibilityLabel: t('diary.category', { value: t(`diary.${id}`) }),
        }))}
        value={categoryId}
        scrollToSelected
        onChange={(id) => {
          initialScrollPending.current = false;
          initialRowY.current = null;
          setCategoryId(id);
        }}
      />
      <PickerInfoCard>
        <View className="h-12 w-12 shrink-0 items-center justify-center">
          <EmotionImage emotion={representativeEmotions[categoryId]} size={appRem * 2.75} />
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-base font-semibold text-theme-accent-deep">
            {t(`diary.${categoryId}`)}
          </Text>
          <Text
            className="text-sm leading-5 tracking-tight text-theme-text-secondary"
            style={{ minHeight: appRem * 2.5 * Math.max(1, fontScale) }}
            lineBreakStrategyIOS="hangul-word"
            textBreakStrategy="balanced"
          >
            {t(`diary.${categoryId}Summary`)}
          </Text>
        </View>
      </PickerInfoCard>
    </View>
  );

  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      fillHeight

    >
      <SheetHeader
        title={allowDeselect ? t('diary.chooseEmotionFilter') : t('diary.chooseEmotion')}
        headerButton={
          <HeaderAction
            label={allowDeselect ? t('common.apply') : t('common.done')}
            disabled={!allowDeselect && draft === null}
            onPress={() => {
              onApply(draft);
              closeSheet();
            }}
          />
        }
        onClose={closeSheet}
      />
      <View className="mx-1">{topContent}</View>
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <AnimatedScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          key={contentKey}
          className="min-h-0 flex-1"
          contentContainerClassName={'gap-3 pb-8'}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          ref={scrollRef}
          onContentSizeChange={(width, height) => {
            sheetFade.onContentSizeChange(width, height);
            revealInitialSelection();
          }}
          onLayout={(event) => {
            sheetFade.onLayout(event);
            (() => {
              opened.current = true;
              revealInitialSelection();
            })();
          }}
        >
          <View
            className="gap-3"
            onLayout={(event) => {
              gridY.current = event.nativeEvent.layout.y;
              revealInitialSelection();
            }}
          >
            {rows.map((row) => (
              <View
                key={row.join('-')}
                className="flex-row gap-3"
                onLayout={(event) => {
                  if (value !== null && row.includes(value) && initialScrollPending.current) {
                    initialRowY.current = event.nativeEvent.layout.y;
                    revealInitialSelection();
                  }
                }}
              >
                {row.map((id) => {
                  const emotion = EMOTIONS[id];
                  const selected = draft === id;
                  return (
                    <View key={emotion.key} className="flex-1 min-w-0">
                      <PickerOption
                        selected={selected}
                        accessibilityLabel={t('diary.emotionSummary', {
                          title: t(`emotions.${emotion.key}`),
                          value: t(`emotions.${emotion.key}Description`).replace(/\n/g, ' '),
                        })}
                        className={`grow w-full gap-2 rounded-2xl border px-4 py-6 ${selected ? 'border-theme-accent' : 'border-transparent'}`}
                        onPress={() => {
                          initialScrollPending.current = false;
                          setDraft(allowDeselect && selected ? null : id);
                        }}
                      >
                        <EmotionImage emotion={id} size={appRem * 4} />
                        <Text
                          className={`text-base text-center font-semibold ${selected ? 'text-theme-accent' : 'text-theme-text-primary'}`}
                        >
                          {t(`emotions.${emotion.key}`)}
                        </Text>
                        <Text
                          className="w-full text-center text-sm leading-5 tracking-tight text-theme-text-secondary"
                          lineBreakStrategyIOS="hangul-word"
                          textBreakStrategy="balanced"
                        >
                          {t(`emotions.${emotion.key}Description`)}
                        </Text>
                      </PickerOption>
                    </View>
                  );
                })}
                {row.length < columns && <View className="flex-1" />}
              </View>
            ))}
          </View>
        </AnimatedScrollView>
        <ScrollEdgeFade edge="top" visible={sheetFade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={sheetFade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>

      <NoticeHost modal />
    </SheetModal>
  );
}
