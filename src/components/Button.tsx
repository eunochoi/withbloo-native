import { type PressableProps, type TextProps, Pressable } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Text } from './Text';
import { ScrollableName } from './ScrollableName';
export function Button({
  label,
  subtle,
  outline = false,
  danger,
  selected,
  className,
  labelWeight = 'semibold',
  labelSize = 'base',
  labelClassName,
  labelStyle,
  autoLineHeight = false,
  scrollableLabel = false,
  ...props
}: PressableProps & {
  label: string;
  subtle?: boolean;
  outline?: boolean;
  danger?: boolean;
  selected?: boolean;
  labelWeight?: 'normal' | 'semibold';
  labelSize?: 'base' | 'lg';
  labelClassName?: string;
  labelStyle?: TextProps['style'];
  autoLineHeight?: boolean;
  scrollableLabel?: boolean;
}) {
  const textClassName = twMerge(
    `${labelSize === 'lg' ? 'text-lg' : 'text-base'} ${labelWeight === 'normal' ? 'font-normal' : 'font-semibold'} ${outline ? (danger ? 'text-theme-danger' : subtle && !selected ? 'text-theme-text-primary' : 'text-theme-accent') : selected || danger || !subtle ? 'text-theme-text-on-accent' : 'text-theme-text-primary'}`,
    labelClassName,
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled, selected }}
      {...props}
      className={`min-h-12 items-center justify-center ios:curve-continuous rounded-full border px-5 py-3 active:opacity-65 ${props.disabled ? 'opacity-40' : 'opacity-100'} ${outline ? `bg-transparent ${danger ? 'border-theme-danger' : subtle && !selected ? 'border-theme-border' : 'border-theme-accent'}` : selected ? 'bg-theme-accent border-theme-accent-deep' : danger ? 'bg-theme-danger border-theme-overlay/15' : subtle ? 'bg-theme-surface-muted border-theme-text-secondary/10' : 'bg-theme-accent border-theme-accent-deep'} ${className ?? ''}`}
    >
      {scrollableLabel ? (
        <ScrollableName className={`${textClassName} text-center`}>{label}</ScrollableName>
      ) : <Text
        autoLineHeight={autoLineHeight}
        style={labelStyle}
        className={textClassName}
      >
        {label}
      </Text>}
    </Pressable>
  );
}
