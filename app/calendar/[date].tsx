import { ScrollEdgeFade } from '../../src/components/ScrollEdgeFade';
import { useScrollFade } from '../../src/hooks/useScrollFade';
import { useIsFocused } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { NoticeHost } from '../../src/components/NoticeProvider';
import { formatDisplayDate } from '../../src/i18n/format';
import { useI18n } from '../../src/i18n/react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SheetHeader } from '../../src/components/SheetHeader';
import { isDate } from '../../src/domain/date';
import { useToday } from '../../src/queries';
import { DayInfo } from '../../src/screens/calendar/DayInfo';

export default function CalendarDayInfo() {
  const sheetFade = useScrollFade();
  const router = useRouter();
  const focused = useIsFocused();
  const { t, formatLocale } = useI18n();

  const { date } = useLocalSearchParams<{ date: string }>();
  const today = useToday();
  const selected = isDate(date) && date <= today ? date : today;
  return (
    <View className="flex-1 px-[5%] pt-2">
      <SheetHeader
        title={
          selected === today
            ? t('calendar.today')
            : formatDisplayDate(selected, formatLocale, 'day')
        }
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/calendar'))}
      />
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          key={selected}
          className="flex-1"
          contentContainerClassName="gap-7 py-8 pb-12"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View>
            <DayInfo key={selected} date={selected} today={today} />
          </View>
        </ScrollView>
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
  );
}
