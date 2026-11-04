import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { UNDERLINE_TAB_LIST_CLASS_NAME } from '../theme/classes';
import { UnderlineTab } from './UnderlineTab';

export function UnderlineTabs<T extends string | number>({
  options,
  value,
  onChange,
  scrollToSelected = false,
  accessibilityLabel,
}: {
  options: readonly { value: T; label: string; accessibilityLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  scrollToSelected?: boolean;
  accessibilityLabel?: string;
}) {
  const { reducedMotion } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const opened = useRef(false);
  useEffect(() => {
    const layout = layouts[String(value)];
    if (scrollToSelected && layout && viewportWidth > 0) {
      scrollRef.current?.scrollTo({
        x: Math.min(
          Math.max(0, contentWidth - viewportWidth),
          Math.max(0, layout.x - (viewportWidth - layout.width) / 2),
        ),
        animated: opened.current && !reducedMotion,
      });
    }
  }, [value, layouts, viewportWidth, contentWidth, reducedMotion, scrollToSelected]);
  const tabs = options.map((option) => (
    <View
      key={option.value}
      onLayout={
        scrollToSelected
          ? (event) => {
              const { x, width } = event.nativeEvent.layout;
              setLayouts((previous) =>
                previous[String(option.value)]?.x === x &&
                previous[String(option.value)]?.width === width
                  ? previous
                  : { ...previous, [String(option.value)]: { x, width } },
              );
            }
          : undefined
      }
    >
      <UnderlineTab
        selected={value === option.value}
        accessibilityLabel={option.accessibilityLabel}
        onPress={() => {
          if (value === option.value) return;
          opened.current = true;
          onChange(option.value);
        }}
      >
        {option.label}
      </UnderlineTab>
    </View>
  ));
  if (!scrollToSelected)
    return (
      <View
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        className={UNDERLINE_TAB_LIST_CLASS_NAME}
      >
        {tabs}
      </View>
    );
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className="grow-0 shrink-0 -mx-[5.555556%]"
      contentContainerClassName="flex-row gap-3"
      contentContainerStyle={{ paddingHorizontal: viewportWidth * 0.05 }}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      directionalLockEnabled
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onContentSizeChange={(width) => setContentWidth(width)}
    >
      {tabs}
    </ScrollView>
  );
}
