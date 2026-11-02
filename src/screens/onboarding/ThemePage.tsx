import { Pressable, View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { Text } from '../../components/Text';
import { useI18n } from '../../i18n/react';
import type { Settings } from '../../settings/model';
import { ACCENT_PALETTES } from '../../theme/colors';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { EmotionIconStyleSelector } from '../settings/EmotionIconStyleSelector';
import { OnboardingFrame } from './OnboardingFrame';
import { sectionTitleClassName } from './styles';
const choiceClassName = 'h-24 min-w-0 items-center justify-center rounded-xl border px-2 py-2';
export function ThemePage({
  settings,
  busy,
  onChange,
}: {
  settings: Settings;
  busy: boolean;
  onChange: (patch: Partial<Settings>) => Promise<void>;
}) {
  const { t } = useI18n();
  const { rem } = useAppTheme();
  return (
    <OnboardingFrame
      title={t('onboarding.themeTitle')}
      description={t('onboarding.themeDescription')}
      info={t('onboarding.themeNotice')}
    >
      <View>
        <Text autoLineHeight className={sectionTitleClassName}>{t('settings.accentColor')}</Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('settings.accentColor')}
          className="my-2 flex-row items-center gap-3 py-2"
        >
          {(['blue', 'green', 'purple', 'pink', 'yellow', 'grey'] as const).map((accent) => (
            <Pressable
              key={accent}
              accessibilityRole="radio"
              accessibilityLabel={t(`settings.${accent}`)}
              accessibilityState={{ checked: settings.themeAccent === accent, disabled: busy }}
              disabled={busy}
              onPress={() => void onChange({ themeAccent: accent })}
              className="aspect-square min-w-0 flex-1 items-center justify-center rounded-full border border-black/10"
              style={{ backgroundColor: ACCENT_PALETTES[accent].accent }}
            >
              {settings.themeAccent === accent && (
                <AppIcon
                  name="check"
                  size={rem * 1.5}
                  className="text-theme-text-on-accent"
                  accessible={false}
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>
      <View className="gap-3">
        <Text autoLineHeight className={sectionTitleClassName}>{t('settings.emotionIcons')}</Text>
        <EmotionIconStyleSelector
          compact
          autoLineHeight
          choiceClassName="h-24"
          labelSize="base"
          labelClassName="text-[13px] text-theme-text-primary"
          value={settings.emotionStyle}
          disabled={busy}
          onChange={(emotionStyle) => void onChange({ emotionStyle })}
        />
      </View>
      <View className="gap-3">
        <Text autoLineHeight className={sectionTitleClassName}>{t('onboarding.background')}</Text>
        <View className="flex-row gap-2">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.themeMode === mode, disabled: busy }}
              accessibilityLabel={t(
                mode === 'light' ? 'settings.themeLight' : mode === 'dark' ? 'settings.themeDark' : 'settings.themeSystem',
              )}
              disabled={busy}
              onPress={() => void onChange({ themeMode: mode })}
              className={`${choiceClassName} flex-1 ${settings.themeMode === mode ? 'border-theme-accent bg-theme-accent-light/50' : 'border-transparent'}`}
            >
              <Text autoLineHeight
                className="text-[13px] text-theme-text-primary"
              >
                {t(mode === 'light' ? 'settings.themeLight' : mode === 'dark' ? 'settings.themeDark' : 'settings.themeSystem')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="gap-3">
        <Text autoLineHeight className={sectionTitleClassName}>{t('settings.fontFamily')}</Text>
        <View className="flex-row gap-2">
          {(['tmoney', 'suit', 'maruburi'] as const).map((fontFamily, index) => (
            <Pressable
              key={fontFamily}
              accessibilityRole="button"
              accessibilityState={{ selected: (settings.fontFamily ?? 'tmoney') === fontFamily, disabled: busy }}
              accessibilityLabel={t(index === 0 ? 'settings.fontType1' : index === 1 ? 'settings.fontType2' : 'settings.fontType3')}
              disabled={busy}
              onPress={() => void onChange({ fontFamily })}
              className={`${choiceClassName} flex-1 gap-2 ${(settings.fontFamily ?? 'tmoney') === fontFamily ? 'border-theme-accent bg-theme-accent-light/50' : 'border-transparent'}`}
            >
              <Text autoLineHeight style={{ fontFamily: fontFamily === 'suit' ? 'SUITRegular' : fontFamily === 'maruburi' ? 'MaruBuriRegular' : 'Tmoney' }} className="text-center text-[15px]">{t('settings.fontPreview')}</Text>
              <Text autoLineHeight className="text-center text-[11px]">{t(index === 0 ? 'settings.fontType1' : index === 1 ? 'settings.fontType2' : 'settings.fontType3')}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="gap-3">
        <Text autoLineHeight className={sectionTitleClassName}>{t('onboarding.fontSize')}</Text>
        <View className="flex-row gap-2">
          {(['small', 'normal', 'large'] as const).map((size) => (
            <Pressable
              key={size}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.fontSize === size, disabled: busy }}
              accessibilityLabel={t(`settings.${size}`)}
              disabled={busy}
              onPress={() => void onChange({ fontSize: size })}
              className={`${choiceClassName} flex-1 ${settings.fontSize === size ? 'border-theme-accent bg-theme-accent-light/50' : 'border-transparent'}`}
            >
              <Text autoLineHeight
                className="text-[13px] text-theme-text-primary"
              >
                {t(`settings.${size}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </OnboardingFrame>
  );
}
