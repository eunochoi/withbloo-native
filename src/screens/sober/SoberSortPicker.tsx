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
import { AppIcon } from '../../components/AppIcon';
import { InfoNotice } from '../../components/InfoNotice';
import { moveItem } from '../../components/sortable/order';
import { Text } from '../../components/Text';
import { sortSobers } from '../../db/sober';
import { soberQueries } from '../../queries';
import { ManualSortList } from '../../components/sortable/ManualSortList';
import { SoberIcon } from '../../components/SoberIcon';
import { StarIcon } from '../../components/StarIcon';
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
  const { colors, iconSizes, rem } = useAppTheme();
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
      gestureHandlerEnabled
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
          <View className="gap-12">
            <View className="gap-10">
              <View className="flex-row items-center gap-2">
                <View className="h-5 w-5 shrink-0 items-center justify-center">
                  <AppIcon
                    name="sort"
                    size={iconSizes.md}
                    color={colors.accent}
                    accessible={false}
                  />
                </View>
                <Text className="min-w-0 flex-1 text-lg font-semibold">{t('habit.criteriaSort')}</Text>
                <Switch
                  accessibilityLabel={t('habit.criteriaSort')}
                  disabled={saving || dragging}
                  value={sort !== 'CUSTOM'}
                  onValueChange={(checked) => setSort(checked ? standardSort : 'CUSTOM')}
                  ios_backgroundColor={colors.switchTrack}
                  trackColor={{ false: colors.switchTrack, true: colors.accent }}
                  thumbColor={colors.switchThumb}
                />
              </View>
              <View
                className="gap-6 pl-7"
                style={{ opacity: sort === 'CUSTOM' ? 0.4 : 1 }}
                pointerEvents={sort === 'CUSTOM' ? 'none' : 'auto'}
                accessibilityElementsHidden={sort === 'CUSTOM'}
                importantForAccessibility={sort === 'CUSTOM' ? 'no-hide-descendants' : 'auto'}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: priority }}
                  onPress={() => setPriority((checked) => !checked)}
                  className="min-h-7 flex-row items-center justify-between gap-3"
                >
                  <Text className="min-w-0 flex-1 text-base font-semibold text-theme-text-secondary">
                    {t('ui.priorityFirst')}
                  </Text>
                  <View
                    className="h-5 w-5 shrink-0 items-center justify-center ios:curve-continuous rounded-md border-[1px] bg-theme-surface"
                    style={{
                      borderColor: `${colors.accent}${priority ? 'BF' : '99'}`,
                      backgroundColor: priority ? `${colors.accent}BF` : undefined,
                    }}
                  >
                    {priority && (
                      <AppIcon name="check" size={iconSizes.sm} color="white" accessible={false} />
                    )}
                  </View>
                </Pressable>
                <View className="gap-3">
                  <Text className="text-base font-semibold text-theme-text-secondary">{t('sober.recordSort')}</Text>
                  <View className="flex-row gap-3">
                    {(['DESC', 'ASC'] as const).map((value) => (
                      <View key={value} className="flex-1">
                        <PickerOption
                          compact
                          keepUncheckedBorder
                          softUncheckedBorder
                          selected={records === value}
                          accessibilityLabel={t(value === 'DESC' ? 'ui.longest' : 'ui.shortest')}
                          onPress={() => setRecords(value)}
                        >
                          <Text
                            className={`text-base ${records === value ? 'text-theme-accent-deep' : ''}`}
                          >
                            {t(value === 'DESC' ? 'ui.longest' : 'ui.shortest')}
                          </Text>
                        </PickerOption>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="gap-3">
                  <Text className="text-base font-semibold text-theme-text-secondary">{t('ui.createdDateSort')}</Text>
                  <View className="flex-row gap-3">
                    {(['DESC', 'ASC'] as const).map((value) => (
                      <View key={value} className="flex-1">
                        <PickerOption
                          compact
                          keepUncheckedBorder
                          softUncheckedBorder
                          selected={standardSort === value}
                          accessibilityLabel={t(value === 'DESC' ? 'ui.newest' : 'ui.oldest')}
                          onPress={() => {
                            setStandardSort(value);
                            setSort(value);
                          }}
                        >
                          <Text
                            className={`text-base ${standardSort === value ? 'text-theme-accent-deep' : ''}`}
                          >
                            {t(value === 'DESC' ? 'ui.newest' : 'ui.oldest')}
                          </Text>
                        </PickerOption>
                      </View>
                    ))}
                  </View>
                </View>
                <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                  {t('ui.recordsDescription', { value: priority ? t('ui.priorityPrefix') : '' })}
                </InfoNotice>
              </View>
            </View>
            <View className="gap-10">
              <View className="flex-row items-center gap-2">
                <View className="h-5 w-5 shrink-0 items-center justify-center">
                  <AppIcon
                    name="drag-indicator"
                    size={iconSizes.md}
                    color={colors.accent}
                    accessible={false}
                  />
                </View>
                <Text className="min-w-0 flex-1 text-lg font-semibold">{t('habit.customSort')}</Text>
                <Switch
                  accessibilityLabel={t('habit.customSort')}
                  disabled={saving || dragging}
                  value={sort === 'CUSTOM'}
                  onValueChange={(checked) => setSort(checked ? 'CUSTOM' : standardSort)}
                  ios_backgroundColor={colors.switchTrack}
                  trackColor={{ false: colors.switchTrack, true: colors.accent }}
                  thumbColor={colors.switchThumb}
                />
              </View>
              <View
                className="gap-4 pl-7"
                style={{ opacity: sort !== 'CUSTOM' ? 0.4 : 1 }}
                pointerEvents={sort !== 'CUSTOM' ? 'none' : 'auto'}
                accessibilityElementsHidden={sort !== 'CUSTOM'}
                importantForAccessibility={sort !== 'CUSTOM' ? 'no-hide-descendants' : 'auto'}
              >
                {sort === 'CUSTOM' && !query.data && <QueryState query={query} />}
                {order && (
                  <ManualSortList
                    items={items}
                    scrollRef={scrollRef}
                    disabled={saving || sort !== 'CUSTOM'}
                    dragging={dragging}
                    onDraggingChange={setDragging}
                    onMove={move}
                    renderIcon={(item) => (
                      <SoberIcon name={item.icon_key} colorKey={item.icon_color} size={rem * 2} />
                    )}
                    renderPriority={(item) =>
                      item.is_priority ? <StarIcon size={rem} color={colors.accent} /> : null
                    }
                    getOrderLabel={(item) => t('sober.orderAction', { value: item.name })}
                    orderHint={t('sober.orderHint')}
                  />
                )}
                {items.length > 1 && (
                  <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                    {t('sober.orderHint')}
                  </InfoNotice>
                )}
              </View>
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
