import { useQuery } from '@tanstack/react-query';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { BottomSheetPage } from '../components/bottom-sheet/BottomSheetPage';
import { CharacterCount } from '../components/CharacterCount';
import { EmotionImage } from '../components/EmotionImage';
import { HeaderAction } from '../components/HeaderAction';
import { useNotice } from '../components/NoticeProvider';
import { QueryState } from '../components/QueryState';
import { RecordFormLayout } from '../components/RecordFormLayout';
import { Text } from '../components/Text';
import { EMOTIONS } from '../domain/constants';
import { isDate } from '../domain/date';
import { DIARY_IMAGE_MAX_COUNT, DIARY_TEXT_MAX_LENGTH } from '../domain/limits';
import { formatDisplayDate } from '../i18n/format';
import { useI18n } from '../i18n/react';
import {
  discardDraftImages,
  mediaUri,
  pickImages,
  saveDiaryImages,
  type DraftImage,
} from '../media';
import { diaryQueries, useRecordMutation, useToday } from '../queries';
import { useAppTheme } from '../theme/AppThemeProvider';
import { FORM_TEXT_INPUT_CLASS_NAME, SECTION_TITLE_CLASS_NAME } from '../theme/classes';
import { DiaryDatePicker } from './diary/DiaryDatePicker';
import { DiaryEmotionPicker } from './diary/DiaryEmotionPicker';
import { ImageAttachments } from '../components/ImageAttachments';
import { ImageAttachmentsHeader } from '../components/ImageAttachmentsHeader';

export function DiaryForm({
  id,
  initialDate,
}: {
  id?: number;
  initialDate?: string;
}) {
  const { t, formatLocale } = useI18n();

  const { showNotice } = useNotice();
  const { colors, rem: appRem } = useAppTheme();
  const db = useSQLiteContext();
  const today = useToday();
  const query = useQuery({ ...diaryQueries.byId(db, id ?? 0), enabled: id !== undefined });
  const [date, setDate] = useState<string | null>(
    isDate(initialDate) && initialDate <= today ? initialDate : null,
  );
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState<number | null>(null);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [picker, setPicker] = useState<'emotion' | 'date' | null>(null);
  const [picking, setPicking] = useState(false);
  const [saved, setSaved] = useState(false);
  const textInput = useRef<TextInput>(null);
  const drafts = useRef<DraftImage[]>([]);
  const mounted = useRef(true);
  const [draftEmotion, setDraftEmotion] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    if (query.data && !loaded.current) {
      loaded.current = true;
      setDate(query.data.date);
      setText(query.data.text);
      setEmotion(query.data.emotion);
      setImages(
        query.data.images.map((image) => ({
          file: image.file_name,
          uri: mediaUri(image.file_name),
        })),
      );
    }
  }, [query.data]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      discardDraftImages(drafts.current);
    };
  }, []);
  const mutation = useRecordMutation(
    async () => {
      if (date === null || !isDate(date) || date > today) throw new Error(t('diary.dateRequired'));
      if (emotion === null) throw new Error(t('diary.emotionRequired'));
      return saveDiaryImages(db, { id, date, emotion, text }, images);
    },
    'diary',
    () => setSaved(true),
    (error) =>
      showNotice({ tone: 'error', title: t('diary.processFailed'), message: error.message }),
  );
  const busy = mutation.isPending || picking;
  usePreventRemove(busy, () =>
    showNotice({
      tone: 'info',
      title: t('diary.wait'),
      message: mutation.isPending ? t('diary.savingHint') : t('diary.preparingPhotos'),
    }),
  );
  const onReorder = useCallback((from: number, to: number) => {
    setImages((previous) => {
      const next = [...previous];
      const [image] = next.splice(from, 1);
      next.splice(to, 0, image);
      return next;
    });
  }, []);
  const onClosed = saved
    ? () =>
      showNotice({
        tone: 'success',
        title: id ? t('diary.edited') : t('diary.saved'),
      })
    : undefined;
  if (id !== undefined && (query.isPending || query.error || !query.data))
    return (
      <BottomSheetPage
        title={t('diary.editTitle')}
        backRoute="/diary"
        closeRequested={saved && !mutation.isPending}
        onClosed={onClosed}
      >
        <View className="items-center justify-center">
          <QueryState query={query} />
          {!query.isPending && !query.error && <Text>{t('diary.notFound')}</Text>}
        </View>
      </BottomSheetPage>
    );
  return (
    <RecordFormLayout
      backRoute="/diary"
      scrollEnabled={!dragging}
      headerButton={
        <HeaderAction
          disabled={busy || dragging}
          onPress={() => {
            if (date === null || !isDate(date) || date > today) {
              showNotice({ tone: 'info', title: t('diary.dateRequired') });
              return;
            }
            if (emotion === null || !Number.isInteger(emotion) || emotion < 0 || emotion >= EMOTIONS.length) {
              showNotice({ tone: 'info', title: t('diary.emotionRequired') });
              return;
            }
            if (!text.trim()) {
              showNotice({ tone: 'info', title: t('diary.storyRequired') });
              textInput.current?.focus();
              return;
            }
            if (text.length > DIARY_TEXT_MAX_LENGTH) {
              showNotice({ tone: 'info', title: t('diary.storyTooLong', { count: DIARY_TEXT_MAX_LENGTH }) });
              textInput.current?.focus();
              return;
            }
            mutation.mutate(undefined);
          }}
          label={mutation.isPending ? t('common.saving') : t('common.save')}
        />
      }
      closeRequested={saved && !mutation.isPending}
      onClosed={onClosed}
      title={id !== undefined ? t('diary.editTitle') : t('diary.createTitle')}
      onBeforeClose={() => {
        if (dragging) return false;
        if (!busy) return true;
        showNotice({
          tone: 'info',
          title: t('diary.wait'),
          message: mutation.isPending ? t('diary.savingHint') : t('diary.preparingPhotos'),
        });
        return false;
      }}
      overlays={
        <>
          {picker === 'date' && (
            <DiaryDatePicker
              value={date}
              diaryId={id}
              onClose={() => setPicker(null)}
              onApply={(next) => {
                setDate(next);
                setPicker(null);
              }}
            />
          )}
          {picker === 'emotion' && (
            <DiaryEmotionPicker
              value={draftEmotion}
              onClose={() => setPicker(null)}
              onApply={(value) => {
                setEmotion(value);
                setPicker(null);
              }}
            />
          )}

        </>
      }
    >
      <View className="shrink-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={date ? t('diary.dateChoice', { title: formatDisplayDate(date, formatLocale, 'date') }) : t('diary.chooseDate')}
          accessibilityState={{ expanded: picker === 'date', disabled: busy || dragging }}
          disabled={busy || dragging || picker !== null}
          onPress={() => { Keyboard.dismiss(); setPicker('date'); }}
          className="min-h-12 flex-row items-center gap-3 active:opacity-70"
        >
          <View className="flex-1 min-w-0 gap-3">
            <Text className={SECTION_TITLE_CLASS_NAME}>{t('diary.dateLabel')}</Text>
            <Text className="px-1 text-base text-theme-text-secondary">
              {date ? formatDisplayDate(date, formatLocale, 'date') : t('diary.datePrompt')}
            </Text>
          </View>
          <View className="h-16 w-16 items-center justify-center">
            <AppIcon name="date-outline" size={appRem * 2.5} color={colors.accent} />
          </View>
        </Pressable>
      </View>
      <View className="shrink-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('diary.chooseTodayEmotion')}
          accessibilityState={{ expanded: picker === 'emotion', disabled: busy }}
          disabled={busy}
          onPress={() => {
            Keyboard.dismiss();
            setDraftEmotion(emotion);
            setPicker('emotion');
          }}
          className="min-h-12 flex-row items-center gap-3 active:opacity-70"
        >
          <View className="flex-1 min-w-0 gap-3">
            <Text className={SECTION_TITLE_CLASS_NAME}>{t('diary.todayEmotion')}</Text>
            <Text className="px-1 text-base text-theme-text-secondary">
              {emotion !== null ? t(`emotions.${EMOTIONS[emotion].key}`) : t('diary.emotionPrompt')}
            </Text>
          </View>
          <View className="h-16 w-16 items-center justify-center">
            {emotion !== null ? (
              <EmotionImage emotion={emotion} size={appRem * 4} />
            ) : (
              <AppIcon name="emotion-outline" size={appRem * 2.5} color={colors.accent} />
            )}
          </View>
        </Pressable>
      </View>
      <View className="gap-3">
        <Text accessibilityRole="header" className={SECTION_TITLE_CLASS_NAME}>
          {t('diary.storyTitle')}
        </Text>
        <View className="gap-3 px-1">
          <TextInput
            ref={textInput}
            accessibilityLabel={t('diary.content')}
            multiline
            scrollEnabled
            value={text}
            onChangeText={setText}
            editable={!busy && picker === null}
            maxLength={DIARY_TEXT_MAX_LENGTH}
            placeholder={t('diary.placeholder')}
            placeholderTextColor={colors.secondary}
            textAlignVertical="top"
            className={`${FORM_TEXT_INPUT_CLASS_NAME} h-[200px] leading-6`}
          />
          <CharacterCount length={text.length} maxLength={DIARY_TEXT_MAX_LENGTH} />
        </View>
      </View>
      <View className="gap-3">
        <ImageAttachmentsHeader title={t('diary.photoTitle')} count={images.length} />
        <View className="gap-3 px-1">
          <Text className="text-base text-theme-text-secondary">{t('diary.photoHint')}</Text>
          <ImageAttachments
            images={images}
            busy={busy}
            picking={picking}
            onDragging={setDragging}
            onReorder={onReorder}
            onRemove={(file) =>
              setImages((previous) => previous.filter((image) => image.file !== file))
            }
            onPick={() => {
              setPicking(true);
              void pickImages(DIARY_IMAGE_MAX_COUNT - images.length)
                .then((added) => {
                  if (!mounted.current) {
                    discardDraftImages(added);
                    return;
                  }
                  drafts.current = [...drafts.current, ...added];
                  setImages((previous) => [...previous, ...added]);
                })
                .catch((error: Error) => {
                  if (mounted.current)
                    showNotice({
                      tone: 'error',
                      title: t('diary.photoFailed'),
                      message: error.message,
                    });
                })
                .finally(() => {
                  if (mounted.current) setPicking(false);
                });
            }}
          />
        </View>
      </View>
    </RecordFormLayout>
  );
}
