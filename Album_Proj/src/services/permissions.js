import {Platform} from 'react-native';
import {check, PERMISSIONS, request, RESULTS, openSettings} from 'react-native-permissions';

const iosPermissions = [
  PERMISSIONS.IOS.PHOTO_LIBRARY,
  PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
  PERMISSIONS.IOS.MEDIA_LIBRARY
];

export async function ensureMediaPermissions() {
  const targets =
    Platform.OS === 'ios'
      ? iosPermissions
      : Platform.OS === 'android'
      ? Platform.Version >= 34
        ? [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES, PERMISSIONS.ANDROID.READ_MEDIA_VIDEO, PERMISSIONS.ANDROID.READ_MEDIA_VISUAL_USER_SELECTED]
        : Platform.Version >= 33
        ? [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES, PERMISSIONS.ANDROID.READ_MEDIA_VIDEO]
        : [PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE]
      : [];

  for (const perm of targets) {
    const status = await check(perm);
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      continue;
    }
    const req = await request(perm);
    if (!(req === RESULTS.GRANTED || req === RESULTS.LIMITED)) {
      if (req === RESULTS.BLOCKED) {
        // User selected "Don't ask again" -> send them to system settings.
        openSettings().catch(() => {});
      }
      return false;
    }
  }
  return true;
}
