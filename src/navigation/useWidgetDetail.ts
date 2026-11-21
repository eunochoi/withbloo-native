import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import type { NavigationProp, ParamListBase } from 'expo-router/react-navigation';

// The sober tab must be focused before a widget can open its detail sheet.
export function useWidgetDetail() {
  const { widgetSoberId, widgetRequest } = useLocalSearchParams<{
    widgetSoberId?: string;
    widgetRequest?: string;
  }>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const router = useRouter();
  const handled = useRef<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      const id =
        typeof widgetSoberId === 'string' && /^\d+$/.test(widgetSoberId)
          ? Number(widgetSoberId)
          : NaN;
      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        typeof widgetRequest !== 'string' ||
        handled.current === widgetRequest
      )
        return;
      let frame: number | undefined;
      const open = () => {
        if (AppState.currentState !== 'active' || frame !== undefined) return;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          if (
            !navigation.isFocused() ||
            AppState.currentState !== 'active' ||
            handled.current === widgetRequest
          )
            return;
          handled.current = widgetRequest;
          navigation.setParams({ widgetSoberId: undefined, widgetRequest: undefined });
          router.navigate({ pathname: '/sober/[id]', params: { id: String(id) } });
        });
      };
      open();
      const subscription = AppState.addEventListener('change', open);
      return () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        subscription.remove();
      };
    }, [navigation, router, widgetSoberId, widgetRequest]),
  );
}
