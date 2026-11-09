import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from './Text';

export function ScrollableName({
  children,
  className = '',
  heading = false,
}: {
  children: string;
  className?: string;
  heading?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [markerWidth, setMarkerWidth] = useState(0);
  const [measurements, setMeasurements] = useState<{ name: string; widths: number[] }>({ name: children, widths: [] });
  const segmenter = (Intl as typeof Intl & { Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => { segment: (value: string) => Iterable<{ segment: string }> } }).Segmenter;
  const characters = segmenter ? Array.from(new segmenter(undefined, { granularity: 'grapheme' }).segment(children), (part) => part.segment) : Array.from(children);
  const prefixes = characters.map((_, index) => characters.slice(0, index + 1).join(''));
  const widths = measurements.name === children ? measurements.widths : [];
  const limit = offset + width - markerWidth;
  const boundary = widths.reduce((last, value) => value <= limit && value > offset ? Math.max(last, value) : last, offset);
  const markerLeft = Math.max(0, boundary - offset);
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    setOffset(0);
  }, [children]);
  const hasMore = contentWidth - width - offset > 1;
  return (
    <View className="w-full min-w-0">
      <ScrollView
        ref={scrollRef}
        horizontal
        contentContainerClassName="flex-grow"
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(nextWidth) => setContentWidth(nextWidth)}
        onScroll={(event) => setOffset(event.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        <Text accessibilityRole={heading ? 'header' : undefined} numberOfLines={1} className={`flex-grow ${className}`}>
          {children}
        </Text>
      </ScrollView>
      {hasMore && (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', opacity: 0, width: 10000 }}>
          <Text className={className} onTextLayout={(event) => setMarkerWidth(event.nativeEvent.lines[0]?.width ?? 0)}>…</Text>
          {prefixes.map((prefix, index) => (
            <Text key={index} className={className} onTextLayout={(event) => {
              const nextWidth = event.nativeEvent.lines[0]?.width ?? 0;
              setMeasurements((previous) => {
                const next = previous.name === children ? [...previous.widths] : [];
                if (next[index] === nextWidth) return previous;
                next[index] = nextWidth;
                return { name: children, widths: next };
              });
            }}>{prefix}</Text>
          ))}
        </View>
      )}
      {hasMore && markerWidth > 0 && widths.filter((value) => value !== undefined).length === prefixes.length && (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="absolute bottom-0 top-0 bg-theme-surface" style={{ left: markerLeft, right: -1 }}>
          <Text className={`${className} text-left`}>…</Text>
        </View>
      )}
    </View>
  );
}
