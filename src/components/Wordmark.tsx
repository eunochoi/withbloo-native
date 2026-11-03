import { useI18n } from '../i18n/react';
import { Image, View, type ImageProps } from 'react-native';
import { useSettings } from '../settings/SettingsProvider';
import { useAppTheme } from '../theme/AppThemeProvider';
import { themeColors } from '../theme/colors';

// Alpha masks shared with Next's public/img/brand assets.
const textMask = require('../../assets/brand/withbloo-text-mask.png');
const accentMask = require('../../assets/brand/withbloo-accent-mask.png');
const dimensions = Image.resolveAssetSource(textMask);
export function Wordmark({
  size = 36,
  mode,
  onLoad,
  onError,
}: {
  size?: number;
  mode?: 'light' | 'dark';
  onLoad?: ImageProps['onLoad'];
  onError?: ImageProps['onError'];
}) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const theme = useAppTheme();
  const colors = themeColors(settings.themeAccent, mode ?? theme.mode);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('ui.brandLogo')}
      className="shrink-0"
      style={{ height: size, width: (size * dimensions.width) / dimensions.height }}
    >
      <Image
        source={textMask}
        accessible={false}
        resizeMode="contain"
        className="absolute inset-0 h-full w-full"
        style={{ tintColor: colors.textPrimary }}
        onError={onError}
      />
      <Image
        source={accentMask}
        accessible={false}
        resizeMode="contain"
        className="absolute inset-0 h-full w-full"
        style={{ tintColor: colors.accent }}
        onLoad={onLoad}
        onError={onError}
      />
    </View>
  );
}
