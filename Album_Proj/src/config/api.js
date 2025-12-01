import {Platform} from 'react-native';

// LAN IP for hitting the Album API from devices on your network
// Update this if your backend runs elsewhere.
const MANUAL_BASE = 'http://192.168.1.114:9000';

const LOCAL_BASE = Platform.select({
  ios: 'http://192.168.1.114:9000',
  android: 'http://192.168.1.114:9000',
  default: 'http://192.168.1.114:9000',
});

const resolvedBase = MANUAL_BASE?.trim() || LOCAL_BASE;

export const API_BASE_URL = `${resolvedBase}/api`;
