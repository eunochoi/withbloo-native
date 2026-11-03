import { useEffect, useState, type ComponentProps } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';

// ScrollView lets a different TextInput take focus even when taps should dismiss the keyboard.
export function FormTextInput({ onFocus, onBlur, ...props }: ComponentProps<typeof TextInput>) {
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return (
    <View className="relative w-full">
      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
      {keyboardVisible && !focused && props.editable !== false && (
        <Pressable
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
          onPress={() => Keyboard.dismiss()}
        />
      )}
    </View>
  );
}
