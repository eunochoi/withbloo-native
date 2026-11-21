import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { PickerOption } from '../../components/PickerOption';
import { HeaderAction } from '../../components/HeaderAction';
import { QueryError } from '../../components/QueryError';
import { Text } from '../../components/Text';
export function HomeYearPicker({
  year,
  currentYear,
  query,
  onClose,
  onApply,
}: {
  year: number;
  currentYear: number;
  query: UseQueryResult<number[], Error>;
  onClose: () => void;
  onApply: (year: number) => void;
}) {
  const { t } = useI18n();
  const [tempYear, setTempYear] = useState(year);
  const { height } = useWindowDimensions();
  const years = [...new Set([...(query.data ?? []), currentYear])].sort((a, b) => b - a);
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
        title={t('home.yearTitle')}
        headerButton={
          !query.isError && !query.isPending ? (
            <HeaderAction
              label={t('common.apply')}
              onPress={() => {
                onApply(tempYear);
                closeSheet();
              }}
            />
          ) : undefined
        }
        onClose={closeSheet}
      />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="gap-7 py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <>
          {query.isError ? (
            <QueryError
              message={t('home.yearsFailed')}
              onRetry={() => {
                void query.refetch();
              }}
            />
          ) : query.isPending ? (
            <Text className="text-center text-theme-text-secondary">
              {t('home.yearsLoading')}
            </Text>
          ) : (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={{
                  maxHeight: height * 0.3,
                }}
                contentContainerClassName="pb-1"
              >
                <View className="flex-row flex-wrap gap-y-1.5">
                  {years.map((value) => (
                    <View
                      key={value}
                      className={`px-1.5 pb-1.5 ${years.length === 1 ? 'w-full' : years.length === 2 ? 'w-1/2' : 'w-1/3'}`}
                    >
                      <PickerOption
                        selected={tempYear === value}
                        accessibilityLabel={t('home.year', { count: value })}
                        onPress={() => setTempYear(value)}
                      >
                        <Text
                          className={`text-base font-normal ${tempYear === value ? 'text-theme-accent-deep' : 'text-theme-text-primary'}`}
                        >
                          {t('home.year', { count: value })}
                        </Text>
                      </PickerOption>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
