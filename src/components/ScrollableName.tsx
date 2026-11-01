import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './Text';

export function ScrollableName({
  children,
  className = '',
  heading = false,
}: {
  children: string;
  className?: string;
  heading?: boolean;
}) {
  const [overflow, setOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [children]);
  return (
    <View className="w-full min-w-0">
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        onTextLayout={(event) => setOverflow(event.nativeEvent.lines.length > 1)}
        className={className}
        style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }}
      >
        {children}
      </Text>
      {expanded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          onTouchEnd={(event) => event.stopPropagation()}
        >
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              setExpanded(false);
            }}
          >
            <Text
              accessibilityRole={heading ? 'header' : undefined}
              numberOfLines={1}
              className={className}
            >
              {children}
            </Text>
          </Pressable>
        </ScrollView>
      ) : overflow ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            setExpanded(true);
          }}
        >
          <Text
            accessibilityRole={heading ? 'header' : undefined}
            numberOfLines={1}
            className={className}
          >
            {children}
          </Text>
        </Pressable>
      ) : (
        <Text
          accessibilityRole={heading ? 'header' : undefined}
          numberOfLines={1}
          className={className}
        >
          {children}
        </Text>
      )}
    </View>
  );
}
