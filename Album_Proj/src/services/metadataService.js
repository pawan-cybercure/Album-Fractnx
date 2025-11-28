import Exif from 'react-native-exif';

export async function getExifForUri(uri: string) {
  try {
    const data = await Exif.getExif(uri);
    return data || undefined;
  } catch (err) {
    console.warn('Exif read failed', err);
    return undefined;
  }
}
