import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useMediaContext} from '../context/MediaContext';
import MediaListItem from '../components/MediaListItem';
import {useTheme} from '../context/ThemeContext';
import BottomTabBar, {TAB_BAR_PADDING} from '../components/BottomTabBar';
import {uploadPhotoToApi} from '../services/photoApi';

const FacesScreen = () => {
  const {faces, media, filterByFace, refresh, selectedDate} = useMediaContext();
  const [activeFace, setActiveFace] = useState(null);
  const [activeTab, setActiveTab] = useState('Photos');
  const [uploading, setUploading] = useState(false);
  const tabs = useMemo(() => ['Photos', 'Collect', 'Create', 'Search'], []);
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  const onSelect = async (faceId) => {
    setActiveFace(faceId);
    await filterByFace(faceId);
  };

  const handleUploadPress = useCallback(async () => {
    if (uploading) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1
    });
    if (result.didCancel) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    setUploading(true);
    try {
      await uploadPhotoToApi({
        uri: asset.uri,
        fileName: asset.fileName || 'photo.jpg',
        mimeType: asset.type,
        selectedDate: selectedDate ? new Date(selectedDate).toISOString() : undefined
      });
      await refresh(selectedDate ?? null);
    } finally {
      setUploading(false);
    }
  }, [selectedDate, refresh, uploading]);

  return (
    <SafeAreaView style={{flex: 1, padding: 16, backgroundColor: colors.background}}>
      <Text style={{fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text}}>Detected Faces</Text>
      <FlatList
        data={faces}
        horizontal
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingBottom: 8}}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            style={{
              padding: 10,
              backgroundColor: activeFace === item.id ? colors.accent : colors.surface,
              borderRadius: 10,
              marginRight: 10
            }}>
            <Text style={{color: activeFace === item.id ? colors.background : colors.text}}>Face {item.id.slice(0, 6)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No faces detected yet.</Text>}
      />
      <TouchableOpacity onPress={() => onSelect(null)} style={{padding: 10, backgroundColor: colors.surface, borderRadius: 8, marginVertical: 10}}>
        <Text style={{color: colors.text}}>Clear filter</Text>
      </TouchableOpacity>

      <FlatList
        contentContainerStyle={{paddingBottom: TAB_BAR_PADDING + insets.bottom}}
        data={media}
        keyExtractor={item => item.id}
        renderItem={({item}) => <MediaListItem item={item} />}
        ItemSeparatorComponent={() => <View style={{height: 12}} />}
        ListEmptyComponent={<Text style={{color: colors.secondaryText}}>No media matches this face.</Text>}
      />

      <BottomTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab)}
        onPlusPress={handleUploadPress}
        uploading={uploading}
      />
    </SafeAreaView>
  );
};

export default FacesScreen;
