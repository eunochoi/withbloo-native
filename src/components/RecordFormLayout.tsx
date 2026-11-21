import { KeyboardAwareAnimatedScrollView } from './AnimatedScrollView';
import { ScrollEdgeFade } from './ScrollEdgeFade';
import { useScrollFade } from '../hooks/useScrollFade';
import { useIsFocused } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { NoticeHost } from './NoticeProvider';
import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { SheetHeader } from './SheetHeader';

export function RecordFormLayout({
  title,
  headerButton,
  backRoute,
  onBeforeClose,
  overlays,
  children,
  scrollEnabled = true,
}: {
  title: string;
  headerButton?: ReactNode;
  backRoute: Href;
  onBeforeClose?: () => boolean;
  overlays?: ReactNode;
  children: ReactNode;
  scrollEnabled?: boolean;
}) {
  const sheetFade = useScrollFade();
  const router = useRouter();
  const focused = useIsFocused();
  return (
    <>
      <View className="flex-1 px-[5%] pt-2">
        <SheetHeader
          title={title}
          headerButton={headerButton}
          onClose={() => {
            if (onBeforeClose?.() !== false) {
              router.canGoBack() ? router.back() : router.replace(backRoute);
            }
          }}
        />
        <View className="mx-1 min-h-0 flex-1 overflow-hidden">
          <KeyboardAwareAnimatedScrollView
            mode="layout"
            bottomOffset={16}
            keyboardShouldPersistTaps="handled"
            onScroll={sheetFade.onScroll}
            scrollEventThrottle={16}
            onLayout={sheetFade.onLayout}
            onContentSizeChange={sheetFade.onContentSizeChange}
            className="flex-1"
            contentContainerClassName="gap-7 py-8 pb-12"
            scrollEnabled={scrollEnabled}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-6">{children}</View>
          </KeyboardAwareAnimatedScrollView>
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
      {overlays}
    </>
  );
}
