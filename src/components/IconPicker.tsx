import { useI18n } from '../i18n/react';
import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AnimatedScrollView } from './AnimatedScrollView';
import { BottomSheetModal } from './BottomSheetModal';
import { HeaderAction } from './HeaderAction';
import { PickerInfoCard } from './PickerInfoCard';
import { PickerGridItem } from './PickerGridItem';
import { Text } from './Text';
import { DotTabs } from './DotTabs';

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

  const { rem: appRem } = useAppTheme();

  const [draft, setDraft] = useState(value);
  const [categoryId, setCategoryId] = useState(
    () => categories.find(({ keys }) => keys.includes(value))?.id ?? categories[0].id,
  );
  const category = categories.find(({ id }) => id === categoryId) ?? categories[0];
  const scrollRef = useAnimatedRef<ScrollView>();
  const gridY = useRef(0);
  const opened = useRef(false);
  const initialScrollPending = useRef(true);
  const initialRowY = useRef<number | null>(null);
  const contentKey = `${category.id}-icons`;

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
    <View className="shrink-0 gap-4 pt-8">
      <DotTabs
        options={categories.map(({ id, label }) => ({
          value: id,
          label,
          accessibilityLabel: t('diary.category', { value: label }),
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
      </PickerInfoCard>
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
          contentContainerClassName="gap-3 px-[5%] pt-2.5 pb-8"
          onContentSizeChange={(width, contentHeight) => {
            if (typeof scrollProps.onContentSizeChange === 'function') {
              scrollProps.onContentSizeChange(width, contentHeight);
            }
            revealInitialSelection();
          }}
        >
          <View className="mx-1">
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
                    <PickerGridItem
                      selected={draft === key}
                      label={label}
                      onPress={() => {
                        initialScrollPending.current = false;
                        setDraft(key);
                      }}
                    >
                      {renderIcon(key)}
                    </PickerGridItem>
                  </View>
                );
              })}
            </View>
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
