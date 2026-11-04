import type { ReactNode } from 'react';
import { PickerOption } from './PickerOption';
import { Text } from './Text';

export function PickerGridItem({
  selected,
  label,
  onPress,
  children,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <PickerOption
      selected={selected}
      accessibilityLabel={label}
      onPress={onPress}
      className="aspect-square w-full min-h-0 justify-center gap-4 rounded-2xl p-2"
    >
      {children}
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        className={`text-center text-sm leading-5 tracking-tight font-normal ${selected ? 'text-theme-accent' : 'text-theme-text-primary'}`}
      >
        {label}
      </Text>
    </PickerOption>
  );
}
