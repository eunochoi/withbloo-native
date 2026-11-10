import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { ContentTopButton } from './ContentTopButton';

export function ContentBottomButton(props: ComponentProps<typeof ContentTopButton>) {
  return <View className="flex-row justify-center"><ContentTopButton {...props} /></View>;
}
