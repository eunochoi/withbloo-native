import { useI18n } from '../i18n/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AnimatedScrollView } from './AnimatedScrollView';
import { BottomSheetModal } from './BottomSheetModal';
import { HeaderAction } from './HeaderAction';
import { PickerOption } from './PickerOption';
import { Text } from './Text';

export interface IconCategory<Key extends string> {
  id: string;
  label: string;
  description: string;
  keys: readonly Key[];
}

export function IconPicker<Key extends string>({
  title,
  value,
  options,
  categories,
  renderIcon,
  onApply,
  onClose,
}: {
  title: string;
  value: Key;
  options: readonly { key: Key; label: string }[];
  categories: readonly [IconCategory<Key>, ...IconCategory<Key>[]];
  renderIcon: (key: Key) => ReactNode;
  onApply: (value: Key) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  const { rem: appRem, reducedMotion } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const [draft, setDraft] = useState(value);
  const [categoryId, setCategoryId] = useState(
    () => categories.find(({ keys }) => keys.includes(value))?.id ?? categories[0].id,
  );
  const category = categories.find(({ id }) => id === categoryId) ?? categories[0];
  const scrollRef = useAnimatedRef<ScrollView>();
  const chipScrollRef = useRef<ScrollView>(null);
  const [chipLayouts, setChipLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const [chipViewportWidth, setChipViewportWidth] = useState(0);
  const [chipContentWidth, setChipContentWidth] = useState(0);
  const gridY = useRef(0);
  const opened = useRef(false);
  const initialScrollPending = useRef(true);
  const initialRowY = useRef<number | null>(null);
  const contentKey = `${category.id}-icons`;

  useEffect(() => {
    const layout = chipLayouts[categoryId];
    if (layout && chipViewportWidth > 0) {
      chipScrollRef.current?.scrollTo({
        x: Math.min(
          Math.max(0, chipContentWidth - chipViewportWidth),
          Math.max(0, layout.x - (chipViewportWidth - layout.width) / 2),
        ),
        animated: opened.current && !reducedMotion,
      });
    }
  }, [categoryId, chipLayouts, chipViewportWidth, chipContentWidth, reducedMotion]);

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
    <View className="shrink-0 gap-4 pt-4 pb-2">
      <ScrollView
        ref={chipScrollRef}
        horizontal
        // Undo the 5% sheet inset relative to its 90%-wide content.
        className="grow-0 shrink-0 -mx-[5.555556%]"
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
        contentContainerStyle={{ paddingHorizontal: chipViewportWidth * 0.05 }}
        bounces={false}
        overScrollMode="never"
        directionalLockEnabled
        onLayout={(event) => setChipViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setChipContentWidth(width)}
      >
        {categories.map(({ id, label }) => (
          <View
            key={id}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setChipLayouts((previous) =>
                previous[id]?.x === x && previous[id]?.width === width
                  ? previous
                  : { ...previous, [id]: { x, width } },
              );
            }}
          >
            <PickerOption
              selected={category.id === id}
              accessibilityLabel={t('diary.category', { value: label })}
              className="min-h-12 rounded-full px-4 py-2"
              onPress={() => {
                if (category.id === id) return;
                initialScrollPending.current = false;
                initialRowY.current = null;
                setCategoryId(id);
              }}
            >
              <Text
                className={`text-sm ${category.id === id ? 'font-semibold text-theme-accent' : 'text-theme-text-secondary'}`}
              >
                {label}
              </Text>
            </PickerOption>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row items-center gap-3 rounded-2xl border border-theme-accent-border bg-theme-accent-soft/70 p-4">
        <View className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-theme-surface">
          {renderIcon(category.keys[0])}
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-base font-semibold text-theme-accent-deep">{category.label}</Text>
          <Text
            className="text-sm leading-5 tracking-tight text-theme-text-secondary"
            lineBreakStrategyIOS="hangul-word"
            textBreakStrategy="balanced"
          >
            {category.description}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      visible
      fixedHeight
      contentFullBleed
      scrollFade
      title={title}
      onClose={onClose}
      scrollRef={scrollRef}
      contentKey={contentKey}
      fixedContent={topContent}
      onOpened={() => {
        opened.current = true;
        revealInitialSelection();
      }}
      renderScrollView={(scrollProps) => (
        <AnimatedScrollView
          {...scrollProps}
          key={contentKey}
          contentContainerClassName="gap-3 px-[5%] pt-4 pb-7"
          onContentSizeChange={(width, contentHeight) => {
            if (typeof scrollProps.onContentSizeChange === 'function') {
              scrollProps.onContentSizeChange(width, contentHeight);
            }
            revealInitialSelection();
          }}
        >
          <View
            className="-mx-1.5 flex-row flex-wrap"
            onLayout={(event) => {
              gridY.current = event.nativeEvent.layout.y;
              revealInitialSelection();
            }}
          >
            {category.keys.map((key) => {
              const label = options.find((option) => option.key === key)!.label;
              return (
                <View
                  key={key}
                  className="aspect-square w-1/3 p-1.5"
                  onLayout={(event) => {
                    if (key === value && initialScrollPending.current) {
                      initialRowY.current = event.nativeEvent.layout.y;
                      revealInitialSelection();
                    }
                  }}
                >
                  <PickerOption
                    selected={draft === key}
                    accessibilityLabel={label}
                    className="h-full w-full min-h-0 gap-2 rounded-2xl p-2"
                    onPress={() => {
                      initialScrollPending.current = false;
                      setDraft(key);
                    }}
                  >
                    <View className="h-10 items-center justify-center">{renderIcon(key)}</View>
                    <View
                      className="w-full items-center justify-center"
                      style={{ height: appRem * 2.5 * fontScale }}
                    >
                      <Text
                        className={`text-sm leading-5 tracking-tight text-center font-semibold ${draft === key ? 'text-theme-accent' : 'text-theme-text-primary'}`}
                      >
                        {label}
                      </Text>
                    </View>
                  </PickerOption>
                </View>
              );
            })}
          </View>
        </AnimatedScrollView>
      )}
      headerRight={(close) => (
        <HeaderAction
          label={t('common.done')}
          onPress={() => {
            onApply(draft);
            close();
          }}
        />
      )}
    />
  );
}
