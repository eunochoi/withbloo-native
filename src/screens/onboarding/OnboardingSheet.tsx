import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { AnimatedScrollView } from '../../components/AnimatedScrollView';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/AppThemeProvider';
import type { CloseBottomSheet } from '../../hooks/useBottomSheetLifecycle';
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
  const confirm = async (close: CloseBottomSheet) => {
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
  return (
    <BottomSheetModal
      visible
      fixedHeight
      contentFullBleed
      scrollFade
      contentKey={page}
      scrollEnabled={!busy}
      dismissible={!firstRun}
      onClose={onClose}
      onBeforeClose={() => allowClose.current && !saving.current}
      renderScrollView={(props) => (
        <AnimatedScrollView {...props} key={page} contentContainerClassName="grow">
          <Animated.View
            className="grow"
            entering={reducedMotion ? undefined : FadeIn.duration(200)}
            exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          >
            <Page settings={settings} busy={busy} onChange={change} />
          </Animated.View>
        </AnimatedScrollView>
      )}
      footer={(close) => (
        <View className="w-full max-w-lg self-center gap-2 px-1 pt-4">
          {!!error && (
            <Text
              accessibilityRole="alert"
              className="text-[14px] leading-[21px] text-theme-danger"
            >
              {error}
            </Text>
          )}
          <View className="flex-row items-stretch gap-3">
            {!isFirst && (
              <View className="min-w-0 flex-1 basis-0">
                <Button
                  label={t('common.previous')}
                  labelSize="lg"
                  labelClassName="text-[15.75px] leading-[24.5px]"
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
                labelSize="lg"
                labelClassName="text-[15.75px] leading-[24.5px]"
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
                onPress={() => (isLast ? confirm(close) : changePage(page + 1))}
                className="w-full grow"
              />
            </View>
          </View>
        </View>
      )}
    />
  );
}
