import React from 'react';
import {Pressable} from 'react-native';

export const PressableOpacity = ({children, style, ...rest}) => {
  return (
    <Pressable
      android_ripple={{color: 'rgba(0,0,0,0.1)', borderless: false}}
      style={({pressed}) => [
        typeof style === 'function' ? style({pressed}) : style,
        pressed ? {opacity: 0.8} : null
      ]}
      {...rest}>
      {children}
    </Pressable>
  );
};
