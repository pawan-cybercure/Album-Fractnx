import React, {useMemo} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext'; //

const PLUS_SIZE = 64;
const BASE_BAR_HEIGHT = 88;
export const TAB_BAR_PADDING = BASE_BAR_HEIGHT + PLUS_SIZE * 0.8;

const BottomTabBar = ({tabs, activeTab, onTabPress, onPlusPress, uploading}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  const [leftTabs, rightTabs] = useMemo(() => {
    const midpoint = Math.ceil(tabs.length / 2);
    return [tabs.slice(0, midpoint), tabs.slice(midpoint)];
  }, [tabs]);

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12 + insets.bottom,
      }}>
      <View
        style={{
          // backgroundColor: colors.accent,
          // borderRadius: 28,
          // padding: 8,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: {width: 0, height: 6},
          elevation: 8,
        }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 4,
            // paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: BASE_BAR_HEIGHT,
            position: 'relative',
          }}>
          {leftTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabPress?.(tab)}
              style={{flex: 1, alignItems: 'center', paddingVertical: 4}}>
              <Text style={{color: activeTab === tab ? colors.accent : colors.text, fontWeight: '700'}}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{width: PLUS_SIZE}} />
          {rightTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabPress?.(tab)}
              style={{flex: 1, alignItems: 'center', paddingVertical: 4}}>
              <Text style={{color: activeTab === tab ? colors.accent : colors.text, fontWeight: '700'}}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={onPlusPress}
            style={{
              position: 'absolute',
              left: '55%',
              marginLeft: -PLUS_SIZE / 2,
              top: -PLUS_SIZE * 0.45,
              width: PLUS_SIZE,
              height: PLUS_SIZE,
              borderRadius: PLUS_SIZE / 2,
              backgroundColor: colors.accent,
              justifyContent: 'center',
              alignItems: 'center',
              // shadowColor: '#000',
              // shadowOpacity: 0.2,
              // shadowRadius: 8,
              // shadowOffset: {width: 0, height: 4},
              elevation: 10,
              borderWidth: 2,
              borderColor: colors.card,
            }}>
            {uploading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{color: colors.background, fontSize: 30, fontWeight: '800'}}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default BottomTabBar;
