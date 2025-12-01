import React, {useState, useRef, useEffect} from 'react';
import {Dimensions, FlatList, Image, RefreshControl, Text, View, Modal, TouchableOpacity, Pressable, SafeAreaView, Animated, PanResponder} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const GAP = 6;
const NUM_COLUMNS = 3;
const SIZE = Math.floor((Dimensions.get('window').width - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS);

const MediaGrid = ({items, loading, emptyText, onRefresh}) => {
  const {colors} = useTheme();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState();
    const translateY = useRef(new Animated.Value(0)).current;
    const panRef = useRef();
    const windowHeight = Dimensions.get('window').height;

    useEffect(() => {
      // reset translateY when opening/closing
      if (!previewVisible) {
        translateY.setValue(0);
      }
    }, [previewVisible, translateY]);

    // PanResponder for swipe-down to close and small-tap to close
    if (!panRef.current) {
      panRef.current = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          translateY.setOffset(translateY.__getValue ? translateY.__getValue() : 0);
          translateY.setValue(0);
        },
        onPanResponderMove: (_evt, gestureState) => {
          // only allow vertical dragging
          translateY.setValue(gestureState.dy);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          translateY.flattenOffset && translateY.flattenOffset();
          const {dy, vy} = gestureState;
          const absDy = Math.abs(dy);
          // Dismiss when dragged past 50% of screen height
          const dismissThreshold = windowHeight * 0.5;
          const velocityThreshold = 0.5;
          if (dy > dismissThreshold || vy > velocityThreshold) {
            // animate out and close
            Animated.timing(translateY, {
              toValue: windowHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              // finalize close
              translateY.setValue(0);
              setPreviewVisible(false);
              setPreviewUri(undefined);
            });
          } else if (absDy < 6) {
            // treat as tap — close
            Animated.timing(translateY, {
              toValue: windowHeight,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              translateY.setValue(0);
              setPreviewVisible(false);
              setPreviewUri(undefined);
            });
          } else {
            // spring back
            Animated.spring(translateY, {toValue: 0, useNativeDriver: true}).start();
          }
        },
      });
    }

  const openPreview = (uri) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewUri(undefined);
  };

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={{gap: GAP}}
        contentContainerStyle={{gap: GAP, paddingBottom: 24, paddingTop: GAP}}
        renderItem={({item}) => (
          <Pressable onPress={() => openPreview(item.uri || item.url)} style={{width: SIZE, height: SIZE}}>
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
          </Pressable>
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

      <Modal visible={previewVisible} animationType="fade" onRequestClose={closePreview} transparent={false}>
        <SafeAreaView style={{flex: 1, backgroundColor: '#000'}}>
          <View style={{flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}}>
            {previewUri ? (
              <Animated.View
                {...panRef.current.panHandlers}
                style={{
                  width: '100%',
                  height: '100%',
                  transform: [{translateY: translateY}],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Pressable onPress={() => {
                  // small tap also closes
                  Animated.timing(translateY, {toValue: windowHeight, duration: 120, useNativeDriver: true}).start(() => {
                    translateY.setValue(0);
                    setPreviewVisible(false);
                    setPreviewUri(undefined);
                  });
                }} style={{flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                  <Animated.Image source={{uri: previewUri}} style={{width: '100%', height: '100%'}} resizeMode="contain" />
                </Pressable>
              </Animated.View>
            ) : null}

            <TouchableOpacity
              onPress={closePreview}
              style={{position: 'absolute', top: 18, right: 18, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20}}>
              <Text style={{color: '#fff', fontWeight: '700'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default MediaGrid;
