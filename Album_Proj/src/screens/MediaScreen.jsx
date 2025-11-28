import React, {useCallback, useMemo, useState} from 'react';
import {Alert, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCalendarMedia} from '../hooks/useCalendarMedia';
import MediaGrid from '../components/MediaGrid';
import {useTheme} from '../context/ThemeContext';
import ThemeToggleButton from '../components/ThemeToggleButton';
import {uploadPhotoToApi} from '../services/photoApi';
import BottomTabBar, {TAB_BAR_PADDING} from '../components/BottomTabBar';

const MediaScreen = ({navigation}) => {
  const {media, selectedDate, markedDates, selectedCalendarKey, loading, progress, selectDate, clearDate, syncLibrary} = useCalendarMedia();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Photos');
  const [uploading, setUploading] = useState(false);
  const tabs = useMemo(() => ['Photos', 'Collections', 'Create', 'Search'], []);
  const bottomPadding = TAB_BAR_PADDING + insets.bottom;

  const handleSync = useCallback(async () => {
    await syncLibrary();
  }, [syncLibrary]);

  const handleDayPress = useCallback(
    (day) => {
      // Day.timestamp is ms since epoch; we normalize to local midnight for filtering.
      const pickedDate = new Date(day.timestamp);
      selectDate(pickedDate);
      syncLibrary(pickedDate);
    },
    [selectDate, syncLibrary]
  );

  const handleClearDate = useCallback(() => {
    clearDate();
    syncLibrary(null);
  }, [clearDate, syncLibrary]);

  const handleUploadPress = useCallback(async () => {
    if (uploading) {
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1
    });
    if (result.didCancel) {
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('No photo selected', 'Please choose a photo to upload.');
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
      await syncLibrary(selectedDate);
      Alert.alert('Uploaded', 'Photo saved to S3.');
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  }, [selectedDate, syncLibrary, uploading]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{padding: 16, gap: 14}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{flex: 1, paddingRight: 10}}>
            <Text style={{fontSize: 22, fontWeight: '800', color: colors.text}}>Calendar Gallery</Text>
            <Text style={{color: colors.secondaryText, marginTop: 4}}>
              {selectedDate ? selectedDate.toDateString() : 'All dates'}
            </Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Faces')}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                backgroundColor: colors.accent,
                borderRadius: 12
              }}>
              <Text style={{color: 'white', fontWeight: '700'}}>Faces</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCalendarOpen((v) => !v)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: colors.surface,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border
              }}>
              <Text style={{color: colors.text, fontWeight: '700'}}>{calendarOpen ? 'Hide calendar' : 'Show calendar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <ThemeToggleButton />
          <TouchableOpacity
            onPress={handleSync}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: colors.accent,
              borderRadius: 10
            }}>
            <Text style={{color: colors.background, fontWeight: '700'}}>Sync library</Text>
          </TouchableOpacity>
        </View>

        {calendarOpen ? (
          <View style={{backgroundColor: colors.card, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: colors.border}}>
            <Calendar
              initialDate={selectedCalendarKey}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              enableSwipeMonths
              hideExtraDays
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                dayTextColor: colors.text,
                monthTextColor: colors.text,
                textDisabledColor: colors.secondaryText,
                selectedDayBackgroundColor: colors.accent,
                arrowColor: colors.text,
                todayTextColor: colors.accent
              }}
              style={{borderRadius: 14}}
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
              <TouchableOpacity
                onPress={handleClearDate}
                style={{paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.surface, borderRadius: 10}}>
                <Text style={{color: colors.text, fontWeight: '600'}}>Clear date</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {loading && (
          <Text style={{color: colors.text}}>
            Processing... {progress?.current ?? 0}/{progress?.total ?? 0}
          </Text>
        )}
      </View>

      <View style={{flex: 1, paddingHorizontal: 16, paddingBottom: bottomPadding}}>
        <MediaGrid items={media} loading={loading} onRefresh={handleSync} emptyText="No photos available for this date." />
      </View>
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

export default MediaScreen;
