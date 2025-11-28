import React from 'react';
import {Text, View} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {useTheme} from '../context/ThemeContext';
import {PressableOpacity} from './pressable';

/**
 * A compact toggle button with icon + label that animates between light/dark.
 */
const ThemeToggleButton = () => {
  const {mode, toggleTheme, colors} = useTheme();
  const knob = useSharedValue(mode === 'dark' ? 1 : 0);

  const onToggle = () => {
    knob.value = withSpring(mode === 'dark' ? 0 : 1, {damping: 12, stiffness: 150});
    toggleTheme();
  };

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{translateX: knob.value * 24}]
  }));

  return (
    <PressableOpacity
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10
      }}>
      <View style={{width: 52, height: 28, borderRadius: 16, backgroundColor: colors.muted, padding: 2}}>
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center'
            },
            knobStyle
          ]}>
          <Text style={{fontSize: 12, fontWeight: '700', color: colors.background}}>{mode === 'dark' ? '🌙' : '☀️'}</Text>
        </Animated.View>
      </View>
      <Text style={{color: colors.text, fontWeight: '700'}}>{mode === 'dark' ? 'Light mode' : 'Dark mode'}</Text>
    </PressableOpacity>
  );
};

export default ThemeToggleButton;
