import React from 'react';
import {Image, Text, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const MediaListItem = ({item}) => {
  const {colors} = useTheme();
  const date = new Date(item.creationDate);
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
      <Image
        source={{uri: item.uri || item.url}}
        style={{width: 110, height: 110, backgroundColor: colors.surface}}
        resizeMode="cover"
      />
      <View style={{flex: 1, padding: 10, gap: 4}}>
        <Text style={{fontWeight: '700', color: colors.text}} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={{color: colors.secondaryText}}>
          {item.mediaType.toUpperCase()}
        </Text>
        <Text style={{color: colors.secondaryText}}>
          {date.toLocaleString()}
        </Text>
        {item.s3Url ? (
          <Text style={{color: colors.success}} numberOfLines={1}>
            S3: uploaded
          </Text>
        ) : (
          <Text style={{color: colors.secondaryText}}>Not uploaded</Text>
        )}
        {item.faces?.length ? (
          <Text style={{color: colors.secondaryText}}>
            Faces: {item.faces.length}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default MediaListItem;
