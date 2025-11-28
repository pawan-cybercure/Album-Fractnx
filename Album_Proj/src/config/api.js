import {Platform} from 'react-native';

// Set this to your LAN IP if testing on a physical device (e.g., http://192.168.1.50:9000)
const MANUAL_BASE = '';

const LOCAL_BASE = Platform.select({
  ios: 'http://localhost:9000',
  android: 'http://10.0.2.2:9000',
  default: 'http://localhost:9000',
});

const resolvedBase = MANUAL_BASE?.trim() || LOCAL_BASE;

export const API_BASE_URL = `${resolvedBase}/api`;
