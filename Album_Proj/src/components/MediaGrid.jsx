import React from 'react';
import {Dimensions, FlatList, Image, RefreshControl, Text, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const GAP = 6;
const NUM_COLUMNS = 3;
const SIZE = Math.floor((Dimensions.get('window').width - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS);

const MediaGrid = ({items, loading, emptyText, onRefresh}) => {
  const {colors} = useTheme();
  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={{gap: GAP}}
      contentContainerStyle={{gap: GAP, paddingBottom: 24, paddingTop: GAP}}
      renderItem={({item}) => (
        <View style={{width: SIZE, height: SIZE, backgroundColor: colors.card, borderRadius: 10, overflow: 'hidden'}}>
          <Image source={{uri: item.uri || item.url}} style={{width: SIZE, height: SIZE}} resizeMode="cover" />
          {item.mediaType === 'video' ? (
            <View
              style={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                backgroundColor: colors.overlay,
                borderRadius: 8
              }}>
              <Text style={{color: colors.text, fontSize: 10, fontWeight: '600'}}>VIDEO</Text>
            </View>
          ) : null}
        </View>
      )}
      ListEmptyComponent={
        <View style={{padding: 24, alignItems: 'center'}}>
          <Text style={{color: colors.secondaryText, fontSize: 16}}>{emptyText || 'No media found.'}</Text>
        </View>
      }
      refreshControl={
        onRefresh
          ? (
            <RefreshControl
              refreshing={!!loading}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.card}
            />
            )
          : undefined
      }
      removeClippedSubviews
      initialNumToRender={24}
      windowSize={6}
    />
  );
};

export default MediaGrid;
