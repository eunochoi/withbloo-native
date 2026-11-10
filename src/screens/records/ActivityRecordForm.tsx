import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { BottomSheetPage } from '../../components/bottom-sheet/BottomSheetPage';
import { DateTimeFields } from '../../components/DateTimeFields';
import { RecordDateTimeField } from '../../components/RecordDateTimeField';
import { HeaderAction } from '../../components/HeaderAction';
import { CharacterCount } from '../../components/CharacterCount';
import { Text } from '../../components/Text';
import { InfoNotice } from '../../components/InfoNotice';
import { ImageAttachments } from '../../components/ImageAttachments';
import { ImageAttachmentsHeader } from '../../components/ImageAttachmentsHeader';
import type { ActivityRecord, RecordScope } from '../../db/records';
import { dateTimeDraft, isDate, parseDateTime } from '../../domain/date';
import { DIARY_IMAGE_MAX_COUNT } from '../../domain/limits';
import { translateErrorMessage } from '../../i18n/errors';
import { useI18n } from '../../i18n/react';
import { discardDraftImages, mediaUri, pickImages, type DraftImage } from '../../media';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function ActivityRecordForm({
  record,
  scope,
  date,
  startedAt,
  habitRecords,
  soberRecords,
  busy,
  error,
  onSave,
  onCancel,
  title,
  backRoute,
  closed,
  canClose,
}: {
  title: string;
  backRoute: '/habit' | `/habit/${number}` | `/sober/${number}`;
  closed: boolean;
  canClose: () => boolean;
  record: Partial<ActivityRecord>;
  scope: RecordScope;
  date?: string;
  startedAt: string;
  habitRecords?: ComponentProps<typeof DateTimeFields>['habitRecords'];
  soberRecords?: ComponentProps<typeof DateTimeFields>['soberRecords'];
  busy: boolean;
  error: string;
  onSave: (input: {
    id?: number;
    type: 'MEMO' | 'RESTART';
    recorded_at: string;
    memo: string | null;
    images: DraftImage[];
  }) => Promise<unknown>;
  onCancel: () => boolean;
}) {
  const { t, language } = useI18n();
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState(() => {
    let time = new Date(Math.floor(Date.now() / 60000) * 60000);
    if (isDate(date))
      time = new Date(
        `${date}T${dateTimeDraft(time.toISOString()).hour}:${dateTimeDraft(time.toISOString()).minute}`,
      );
    if (+time < Date.parse(startedAt)) time = new Date(startedAt);
    return dateTimeDraft(record.recorded_at ?? time.toISOString());
  });
  const [isRestart, setIsRestart] = useState(record.type === 'RESTART');
  const [memo, setMemo] = useState(record.memo ?? '');
  const [images, setImages] = useState<DraftImage[]>(() => (record.images ?? []).map((image) => ({ file: image.file_name, uri: mediaUri(image.file_name) })));
  const [picking, setPicking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drafts = useRef(images);
  drafts.current = images;
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; discardDraftImages(drafts.current); };
  }, []);
  const [validation, setValidation] = useState('');
  return (
    <BottomSheetPage
      title={title}
      backRoute={backRoute}
      closeRequested={closed}
      onBeforeClose={() => canClose() && onCancel()}
      headerButton={
        <HeaderAction
          label={t('common.save')}
          disabled={busy || picking || dragging}
          onPress={() => {
            try {
              if (!isRestart && !memo.trim()) {
                setValidation(t('habit.recordTextRequired'));
                return;
              }
              let recorded_at = parseDateTime(draft, Date.now());
              if (Date.parse(recorded_at) < Date.parse(startedAt)) {
                if (Math.floor(Date.parse(recorded_at) / 60000) !== Math.floor(Date.parse(startedAt) / 60000))
                  throw new Error(t('habit.afterStart'));
                recorded_at = startedAt;
              }
              setValidation('');
              void onSave({
                id: record.id,
                type: isRestart ? 'RESTART' : 'MEMO',
                recorded_at,
                memo: memo.trim() || null,
                images,
              });
            } catch (failure) {
              setValidation(failure instanceof Error ? failure.message : t('common.retryMessage'));
            }
          }}
        />
      }
    >
      <View className="gap-5">
        {scope === 'sober' && (
          <View className="min-h-12 flex-row items-center justify-between gap-3">
            <Text accessibilityRole="header" className="text-lg font-semibold">{t('sober.restart')}</Text>
            <Switch accessibilityLabel={t('sober.restart')} value={isRestart} disabled={busy} onValueChange={(value) => { setIsRestart(value); setValidation(''); }} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.surface} />
          </View>
        )}
        <RecordDateTimeField
          compactCalendar
          habitRecords={habitRecords}
          soberRecords={soberRecords}
          draft={draft}
          minTime={startedAt}
          disabled={busy}
          onChange={setDraft}
        />
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-lg font-semibold">{t('habit.memo')}{isRestart && <> <Text className="text-base font-normal text-theme-text-tertiary">{t('habit.descriptionOptional')}</Text></>}</Text>
          <TextInput
            accessibilityLabel={t('habit.memo')}
            value={memo}
            editable={!busy}
            onChangeText={(value) => { setMemo(value); setValidation(''); }}
            multiline
            scrollEnabled
            maxLength={500}
            textAlignVertical="top"
            placeholder={t(isRestart ? 'habit.restartMemoPlaceholder' : 'habit.memoPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            className="mx-1 h-[200px] bg-transparent p-0 text-base leading-6 text-theme-text-primary font-normal"
          />
          <CharacterCount length={memo.length} maxLength={500} />
        </View>
        <View className="gap-3">
          <ImageAttachmentsHeader title={t('ui.photoTitle')} count={images.length} />
          <Text className="px-1 text-base text-theme-text-secondary">{t('habit.recordPhotoHint')}</Text>
          <ImageAttachments images={images} busy={busy || picking} picking={picking} onDragging={setDragging}
            onPick={() => { setPicking(true); void pickImages(DIARY_IMAGE_MAX_COUNT - images.length).then((added) => { if (!mounted.current) { discardDraftImages(added); return; } drafts.current = [...drafts.current, ...added]; setImages((current) => [...current, ...added]); }).catch((failure) => { if (mounted.current) setValidation(failure instanceof Error ? failure.message : t('common.retryMessage')); }).finally(() => { if (mounted.current) setPicking(false); }); }}
            onRemove={(file) => setImages((current) => { const removed = current.filter((image) => image.file === file); discardDraftImages(removed); return current.filter((image) => image.file !== file); })}
            onReorder={(from, to) => setImages((current) => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; })} />
        </View>
        {scope === 'sober' && <InfoNotice>{t('habit.restartSwitchHint')}</InfoNotice>}
        {!!(validation || error) && (
          <Text accessibilityRole="alert" className="text-sm text-theme-danger">
            {translateErrorMessage(validation || error, language)}
          </Text>
        )}
      </View>
    </BottomSheetPage>
  );
}
