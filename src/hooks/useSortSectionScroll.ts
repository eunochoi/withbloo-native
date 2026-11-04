import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';

export function useSortSectionScroll({ visible, initialCustom, ready, scrollRef, rem, reducedMotion }: {
  visible: boolean;
  initialCustom: boolean;
  ready: boolean;
  scrollRef: AnimatedRef<ScrollView>;
  rem: number;
  reducedMotion: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [customY, setCustomY] = useState<number | null>(null);
  const pending = useRef(true);

  useEffect(() => {
    if (!visible) {
      pending.current = true;
      setOpened(false);
      setCustomY(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !opened || !pending.current) return;
    if (initialCustom && (!ready || customY === null)) return;
    const frame = requestAnimationFrame(() => {
      if (!pending.current || !scrollRef.current) return;
      pending.current = false;
      scrollRef.current.scrollTo({ y: initialCustom ? (customY ?? 0) + rem * 2 : 0, animated: !reducedMotion });
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, opened, initialCustom, ready, customY, scrollRef, rem, reducedMotion]);

  const cancelInitialScroll = useCallback(() => { pending.current = false; }, []);

  const onCustomLayout = useCallback((event: LayoutChangeEvent) => {
    setCustomY(event.nativeEvent.layout.y);
  }, []);

  return { onOpened: () => setOpened(true), onCustomLayout, cancelInitialScroll };
}
