import { View } from 'react-native';
import { DIARY_IMAGE_MAX_COUNT } from '../domain/limits';
import { useI18n } from '../i18n/react';
import { SECTION_TITLE_CLASS_NAME } from '../theme/classes';
import { Text } from './Text';

export function ImageAttachmentsHeader({ title, count }: { title: string; count: number }) {
  const { t } = useI18n();
  return (
    <View className="flex-row items-baseline justify-between gap-2">
      <Text accessibilityRole="header" className={`flex-shrink ${SECTION_TITLE_CLASS_NAME}`}>
        {title} <Text className="text-base font-normal text-theme-text-tertiary">{t('habit.descriptionOptional')}</Text>
      </Text>
      <Text className="shrink-0 text-base text-theme-text-secondary">
        {t('diary.photoLimit', { count, value: DIARY_IMAGE_MAX_COUNT })}
      </Text>
    </View>
  );
}
