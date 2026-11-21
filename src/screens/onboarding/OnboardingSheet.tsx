import { ScrollEdgeFade } from '../../components/ScrollEdgeFade';
import { useScrollFade } from '../../hooks/useScrollFade';
import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { completeOnboarding, hasCompletedOnboarding } from '../../onboarding/storage';
import type { Settings } from '../../settings/model';
import { useSettings } from '../../settings/SettingsProvider';
import { WelcomePage } from './WelcomePage';
import { ThemePage } from './ThemePage';
import { UsagePage } from './UsagePage';
import { CalendarGuidePage } from './CalendarGuidePage';
import { BackupPage } from './BackupPage';
import { StartPage } from './StartPage';
const pages = [WelcomePage, ThemePage, UsagePage, CalendarGuidePage, BackupPage, StartPage];
export function FirstRunOnboarding({ ready }: { ready: boolean }) {
  const [required, setRequired] = useState(false);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void hasCompletedOnboarding()
      .then((completed) => {
        if (active) setRequired(!completed);
      })
      .catch(() => {
        if (!active) return;
        setRequired(true);
      });
    return () => {
      active = false;
    };
  }, [ready]);
  return required ? <OnboardingSheet firstRun onClose={() => setRequired(false)} /> : null;
}

export function OnboardingSheet({
  firstRun = false,
  onClose,
}: {
  firstRun?: boolean;
  onClose: () => void;
}) {
  const sheetFade = useScrollFade();
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();
  const { reducedMotion } = useAppTheme();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const allowClose = useRef(!firstRun);
  const Page = pages[page];
  const isFirst = page === 0;
  const isLast = page === pages.length - 1;
  const changePage = (next: number) => {
    if (saving.current || next < 0 || next >= pages.length) return;
    setPage(next);
    setError('');
  };
  const change = async (patch: Partial<Settings>) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await updateSettings(patch);
    } catch {
      setError(t('onboarding.saveFailed'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const confirm = async (close: () => void) => {
    if (saving.current || !isLast || (firstRun && allowClose.current)) return;
    setError('');
    if (!firstRun) {
      close();
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      await completeOnboarding();
      allowClose.current = true;
      saving.current = false;
      close();
    } catch {
      setError(t('onboarding.completeFailed'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => {
    if (!(() => allowClose.current && !saving.current)()) return false;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      enablePanDownToClose={!firstRun && !busy}
      fillHeight
    >
      <SheetHeader
        onClose={
          !firstRun && !busy
            ? () => {
                if (!firstRun && !busy) closeSheet();
              }
            : undefined
        }
      />

      <View className="min-h-0 flex-1 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          key={page}
          className="min-h-0 flex-1"
          contentContainerClassName={'grow'}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          scrollEnabled={!busy}
        >
          <Animated.View
            className="grow"
            entering={reducedMotion ? undefined : FadeIn.duration(200)}
            exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          >
            <Page settings={settings} busy={busy} onChange={change} />
          </Animated.View>
        </ScrollView>
        <ScrollEdgeFade edge="top" visible={sheetFade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={sheetFade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>
      <View className="pb-4">
        <View className="w-full max-w-lg self-center gap-2 pt-4">
          {!!error && (
            <Text accessibilityRole="alert" className="text-[14px] text-theme-danger">
              {error}
            </Text>
          )}
          <View className="flex-row items-stretch gap-3">
            {!isFirst && (
              <View className="min-w-0 flex-1 basis-0">
                <Button
                  autoLineHeight
                  label={t('common.previous')}
                  labelSize="lg"
                  labelClassName="text-[16px]"
                  subtle
                  outline
                  disabled={busy}
                  onPress={() => changePage(page - 1)}
                  className="w-full grow"
                />
              </View>
            )}
            <View className="min-w-0 flex-1 basis-0">
              <Button
                autoLineHeight
                labelSize="lg"
                labelClassName="text-[16px]"
                label={
                  busy
                    ? t('common.saving')
                    : isLast
                      ? firstRun
                        ? t('onboarding.start')
                        : t('common.close')
                      : t('common.next')
                }
                disabled={busy}
                onPress={() => (isLast ? confirm(closeSheet) : changePage(page + 1))}
                className="w-full grow"
              />
            </View>
          </View>
        </View>
      </View>
      <NoticeHost modal />
    </SheetModal>
  );
}
