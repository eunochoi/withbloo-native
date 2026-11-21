import { ScrollEdgeFade } from '../../components/ScrollEdgeFade';
import { useScrollFade } from '../../hooks/useScrollFade';
import { AnimatedScrollView } from '../../components/AnimatedScrollView';
import { SheetHeader } from '../../components/SheetHeader';
import { ContentBottomButton } from '../../components/ContentBottomButton';
import { useI18n } from '../../i18n/react';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useCallback, useEffect, useState } from 'react';
import { Pressable, Switch, View, type ScrollView } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from '../../components/HeaderAction';
import { NoticeHost, useNotice } from '../../components/NoticeProvider';
import { QueryState } from '../../components/QueryState';
import { PickerOption } from '../../components/PickerOption';
import { InfoNotice } from '../../components/InfoNotice';
import { moveItem } from '../../components/sortable/order';
import { Text } from '../../components/Text';
import { sortSobers } from '../../db/sober';
import { soberQueries } from '../../queries';
import { SoberManualSortList } from './SoberManualSortList';
import { useSettings } from '../../settings/SettingsProvider';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function SoberSortPicker({
  visible,
  onClose,
  onApplied,
}: {
  visible: boolean;
  onClose: () => void;
  onApplied?: () => void;
}) {
  const sheetFade = useScrollFade();
  const { t } = useI18n();
  const { showNotice } = useNotice();
  const { colors } = useAppTheme();
  const scrollRef = useAnimatedRef<ScrollView>();
  const db = useSQLiteContext();
  const { settings, updateSettings } = useSettings();
  const query = useQuery({ ...soberQueries.list(db), enabled: visible });
  const [order, setOrder] = useState<number[] | null>(() =>
    query.data
      ? sortSobers(query.data, { ...settings, soberSort: 'CUSTOM' }).map((item) => item.id)
      : null,
  );
  const [sort, setSort] = useState<'ASC' | 'DESC' | 'CUSTOM'>(settings.soberSort);
  const [priority, setPriority] = useState(settings.soberPriorityFirst);
  const [records, setRecords] = useState(settings.soberRecordSort);
  const [standardSort, setStandardSort] = useState<'ASC' | 'DESC'>(
    settings.soberSort === 'CUSTOM' ? 'DESC' : settings.soberSort,
  );
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const initial = query.data
    ? sortSobers(query.data, { ...settings, soberSort: 'CUSTOM' }).map((sober) => sober.id)
    : [];
  const defaults = query.data
    ? sortSobers(query.data, { ...settings, soberSort: 'CUSTOM', soberOrder: [] }).map(
        (sober) => sober.id,
      )
    : [];
  useEffect(() => {
    if (visible) {
      setSort(settings.soberSort);
      setStandardSort(settings.soberSort === 'CUSTOM' ? 'DESC' : settings.soberSort);
      setPriority(settings.soberPriorityFirst);
      setRecords(settings.soberRecordSort);
    }
  }, [visible, settings.soberSort]);
  useEffect(() => {
    if (visible && query.data && order === null) setOrder(initial);
  }, [visible, query.data, order, initial]);
  const move = useCallback(
    (from: number, to: number) =>
      setOrder((previous) => {
        if (!previous) return previous;
        return moveItem(previous, from, to);
      }),
    [],
  );
  const items = (order ?? [])
    .map((id) => query.data?.find((sober) => sober.id === id))
    .filter((sober) => sober !== undefined);
  const isDefault =
    order !== null &&
    order.length === defaults.length &&
    order.every((id, i) => defaults[i] === id);
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    if (visible) sheet.current?.present();
    else sheet.current?.dismiss();
  }, [visible]);
  const closeSheet = () => {
    if (
      !(() => {
        if (!saving && !dragging) return true;
        if (saving)
          showNotice({ tone: 'info', title: t('habit.wait'), message: t('habit.savingHint') });
        return false;
      })()
    )
      return false;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      enablePanDownToClose={!saving && !dragging}

    >
      <SheetHeader
        title={t('sober.sort')}
        headerButton={
          <HeaderAction
            disabled={saving || dragging || (sort === 'CUSTOM' && (!order || !query.data))}
            label={t('common.apply')}
            onPress={() => {
              setSaving(true);
              void updateSettings({
                soberSort: sort,
                soberPriorityFirst: sort === 'CUSTOM' ? false : priority,
                soberRecordSort: records,
                ...(sort === 'CUSTOM' ? { soberOrder: isDefault ? [] : (order ?? []) } : {}),
              })
                .then(() => {
                  onApplied?.();
                  closeSheet();
                })
                .catch((error: Error) =>
                  showNotice({
                    tone: 'error',
                    title: t('habit.saveFailed'),
                    message: error.message,
                  }),
                )
                .finally(() => setSaving(false));
            }}
          />
        }
        onClose={
          !saving && !dragging
            ? () => {
                if (!saving && !dragging) closeSheet();
              }
            : undefined
        }
      />

      <View className="mx-1 shrink grow-0 overflow-hidden">
        <AnimatedScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          className="min-h-0 shrink grow-0"
          contentContainerClassName="gap-7 py-8"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          ref={scrollRef}
          scrollEnabled={!dragging}
        >
          <View accessibilityRole="radiogroup" accessibilityLabel={t('sober.sort')}>
            <View className="gap-8 pb-8">
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: sort !== 'CUSTOM' }} onPress={() => setSort(standardSort)} className="flex-row items-center gap-2">
                <View className="h-5 w-5 items-center justify-center rounded-full border border-theme-accent">
                  {sort !== 'CUSTOM' && <View className="h-3 w-3 rounded-full bg-theme-accent" />}
                </View>
                <Text className="text-lg font-semibold">{t('habit.criteriaSort')}</Text>
              </Pressable>
              <View className="gap-8" style={{ opacity: sort === 'CUSTOM' ? 0.4 : 1 }} pointerEvents={sort === 'CUSTOM' ? 'none' : 'auto'} accessibilityElementsHidden={sort === 'CUSTOM'} importantForAccessibility={sort === 'CUSTOM' ? 'no-hide-descendants' : 'auto'}>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-base font-semibold">{t('ui.priorityFirst')}</Text>
                  <Switch accessibilityLabel={t('ui.priorityFirst')} value={priority} onValueChange={setPriority} ios_backgroundColor={colors.switchTrack} trackColor={{ false: colors.switchTrack, true: colors.accent }} thumbColor={colors.switchThumb} />
                </View>
                <View className="gap-3">
                  <Text className="text-base font-semibold">{t('sober.recordSort')}</Text>
                  <View className="flex-row gap-3">
                    {(['DESC', 'ASC'] as const).map((value) => (
                      <View key={value} className="flex-1">
                        <PickerOption compact keepUncheckedBorder softUncheckedBorder selected={records === value} accessibilityLabel={t(value === 'DESC' ? 'ui.longest' : 'ui.shortest')} onPress={() => setRecords(value)}>
                          <Text className={`text-base ${records === value ? 'text-theme-accent-deep' : ''}`}>{t(value === 'DESC' ? 'ui.longest' : 'ui.shortest')}</Text>
                        </PickerOption>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="gap-3">
                  <Text className="text-base font-semibold">{t('ui.createdDateSort')}</Text>
                  <View className="flex-row gap-3">
                    {(['DESC', 'ASC'] as const).map((value) => (
                      <View key={value} className="flex-1">
                        <PickerOption compact keepUncheckedBorder softUncheckedBorder selected={standardSort === value} accessibilityLabel={t(value === 'DESC' ? 'ui.newest' : 'ui.oldest')} onPress={() => { setStandardSort(value); setSort(value); }}>
                          <Text className={`text-base ${standardSort === value ? 'text-theme-accent-deep' : ''}`}>{t(value === 'DESC' ? 'ui.newest' : 'ui.oldest')}</Text>
                        </PickerOption>
                      </View>
                    ))}
                  </View>
                </View>
                <InfoNotice>{t('ui.recordsDescription', { value: priority ? t('ui.priorityPrefix') : '' })}</InfoNotice>
              </View>
            </View>
            <View className="gap-8 border-t border-theme-border/30 pt-8">
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: sort === 'CUSTOM' }} onPress={() => { setSort('CUSTOM'); }} className="flex-row items-center gap-2">
                <View className="h-5 w-5 items-center justify-center rounded-full border border-theme-accent">
                  {sort === 'CUSTOM' && <View className="h-3 w-3 rounded-full bg-theme-accent" />}
                </View>
                <Text className="text-lg font-semibold">{t('habit.customSort')}</Text>
              </Pressable>
              <View className="gap-8" style={{ opacity: sort !== 'CUSTOM' ? 0.4 : 1 }} pointerEvents={sort !== 'CUSTOM' ? 'none' : 'auto'} accessibilityElementsHidden={sort !== 'CUSTOM'} importantForAccessibility={sort !== 'CUSTOM' ? 'no-hide-descendants' : 'auto'}>
                {sort === 'CUSTOM' && !query.data && <QueryState query={query} />}
                {order && <SoberManualSortList items={items} scrollRef={scrollRef} disabled={sort !== 'CUSTOM'} saving={saving} dragging={dragging} onDraggingChange={setDragging} onOrderChange={setOrder} onMove={move} />}
                <InfoNotice>{t('ui.customDescription')}</InfoNotice>
              </View>
            </View>
          <ContentBottomButton
              label={t('ui.reset')}
              accessibilityLabel={t('ui.resetSelection')}
              disabled={saving || dragging || (sort === 'CUSTOM' && !order)}
              onPress={() => {
                if (sort === 'CUSTOM') {
                  setOrder(defaults);
                } else {
                  setSort('DESC');
                  setStandardSort('DESC');
                  setPriority(false);
                  setRecords('DESC');
                }
              }}
            />
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
