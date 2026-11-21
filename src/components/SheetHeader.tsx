import { useI18n } from '../i18n/react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AppIcon } from './AppIcon';
import { Text } from './Text';
import { ScrollableName } from './ScrollableName';

export function SheetHeader({
  title,
  scrollableTitle = false,
  handleColor,
  headerButton,
  menuAction,
  onClose,
  handleDisabled = false,
}: {
  title?: string;
  scrollableTitle?: boolean;
  handleColor?: string;
  headerButton?: ReactNode;
  menuAction?: ReactNode;
  onClose?: () => void;
  handleDisabled?: boolean;
}) {
  const { t } = useI18n();
  const { colors, iconSizes } = useAppTheme();
  return (
    <View className="shrink-0 items-center">
      {onClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          accessibilityState={{ disabled: handleDisabled }}
          disabled={handleDisabled}
          onPress={() => onClose()}
          className="h-9 w-9 items-center justify-center ios:curve-continuous rounded-full"
          hitSlop={4}
        >
          <View
            style={handleColor ? { backgroundColor: handleColor } : undefined}
            className="h-1 w-8 ios:curve-continuous rounded-full bg-theme-accent"
          />
        </Pressable>
      )}
      {(title || menuAction || headerButton || onClose) && (
        <View
          className={`relative min-h-11 self-stretch flex-row items-center py-1 ${headerButton ? 'px-20' : onClose || menuAction ? 'px-11' : ''}`}
        >
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityState={{ disabled: handleDisabled }}
              disabled={handleDisabled}
              onPress={onClose}
              className="absolute left-0 z-10 -ml-3.5 h-11 w-11 items-center justify-center active:opacity-70 disabled:opacity-40"
            >
              <AppIcon name="chevron-left" size={iconSizes.md} color={colors.accent} accessible={false} />
            </Pressable>
          )}
          <View className="flex-1 min-w-0 flex-row items-center justify-center gap-2">
            {scrollableTitle && title ? (
              <View className="min-w-0 flex-1">
                <ScrollableName
                  heading
                  className="text-center text-xl font-semibold tracking-tight"
                >
                  {title}
                </ScrollableName>
              </View>
            ) : (
              <Text
                accessibilityRole="header"
                className="shrink text-center text-xl font-semibold tracking-tight"
              >
                {title}
              </Text>
            )}
          </View>
          {(menuAction || headerButton) && (
            <View className="absolute right-0 flex-row items-center gap-2">
              {menuAction}
              {headerButton}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
