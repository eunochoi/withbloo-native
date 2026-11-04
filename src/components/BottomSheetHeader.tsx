import { useI18n } from '../i18n/react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AppIcon } from './AppIcon';
import { Text } from './Text';
import { ScrollableName } from './ScrollableName';

export function BottomSheetHeader({
  title,
  scrollableTitle = false,
  handleColor,
  titleIcon,
  titleAction,
  headerLeft,
  headerRight,
  menuAction,
  onClose,
  handleDisabled = false,
}: {
  title?: string;
  scrollableTitle?: boolean;
  handleColor?: string;
  titleIcon?: ReactNode;
  titleAction?: {
    onPress: () => void;
    accessibilityLabel: string;
    disabled?: boolean;
    showChevron?: boolean;
  };
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  menuAction?: ReactNode;
  onClose?: () => void;
  handleDisabled?: boolean;
}) {
  const { t } = useI18n();
  const { iconSizes } = useAppTheme();
  return (
    <View className="shrink-0 items-center ">
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
      {(title || titleIcon || menuAction || headerLeft || headerRight) && (
        <View
          className={`relative self-stretch flex-row items-center gap-2 py-1 ${headerLeft || headerRight ? 'px-20' : ''}`}
        >
          {menuAction && <View className="w-11 shrink-0" />}
          <View className="flex-1 min-w-0 flex-row items-center justify-center gap-2">
            {titleIcon}
            {titleAction ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={titleAction.accessibilityLabel}
                accessibilityState={{ disabled: !!titleAction.disabled }}
                disabled={titleAction.disabled}
                onPress={() => {
                  if (!titleAction.disabled) titleAction.onPress();
                }}
                className="min-h-11 min-w-0 shrink flex-row items-center justify-center gap-1.5 px-2 active:opacity-70"
              >
                {titleAction.showChevron !== false && (
                  <View style={{ width: iconSizes.md }} className="shrink-0" accessible={false} />
                )}
                <Text
                  numberOfLines={1}
                  className="min-w-0 shrink text-center text-xl font-semibold tracking-tight"
                >
                  {title}
                </Text>
                {titleAction.showChevron !== false && (
                  <View
                    style={{ width: iconSizes.md }}
                    className="shrink-0 items-center"
                    accessible={false}
                  >
                    <AppIcon
                      name="chevron-right"
                      size={iconSizes.md}
                      className="text-theme-text-secondary"
                    />
                  </View>
                )}
              </Pressable>
            ) : scrollableTitle && title ? (
              <View className="min-w-0 flex-1">
                <ScrollableName heading className="text-center text-xl font-semibold tracking-tight">
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
          {menuAction && <View className="w-11 shrink-0 items-end">{menuAction}</View>}
          {headerLeft && <View className="absolute left-0 items-center">{headerLeft}</View>}
          {headerRight && <View className="absolute right-0 items-center">{headerRight}</View>}
        </View>
      )}
    </View>
  );
}
