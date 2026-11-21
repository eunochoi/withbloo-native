import { ScrollEdgeFade } from './ScrollEdgeFade';
import { useScrollFade } from '../hooks/useScrollFade';
import { NoticeHost } from './NoticeProvider';
import { SheetHeader } from './SheetHeader';
import { SheetSectionHeading } from './SheetSectionHeading';
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/react';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { SheetModal } from './SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from './HeaderAction';
import { ContentBottomButton } from './ContentBottomButton';

export function FilterSheet({
  title,
  children,
  onClose,
  onReset,
  onApply,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const sheetFade = useScrollFade();
  const { t } = useI18n();
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}

    >
      <SheetHeader
        title={title}
        headerButton={
          <HeaderAction
            label={t('common.apply')}
            accessibilityLabel={t('ui.applyTitle', { title })}
            onPress={() => {
              onApply();
              closeSheet();
            }}
          />
        }
        onClose={closeSheet}
      />

      <View className="mx-1 shrink grow-0 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          className="min-h-0 shrink grow-0"
          contentContainerClassName="gap-7 py-8"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-10">
            <SheetSectionHeading icon="filter-list" title={t('ui.filterConditions')} />
            <View className="gap-6 pl-7">{children}</View>
          </View>
          <ContentBottomButton
            label={t('ui.reset')}
            accessibilityLabel={t('ui.resetSelection')}
            onPress={onReset}
          />
        </ScrollView>
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
