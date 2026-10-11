import type { CapacitorConfig } from '@capacitor/cli';

const isLiveReload = process.env.CAP_LIVE_RELOAD === 'true';

// Local development server config
const DEV_SERVER_IP = '192.168.1.246';
const DEV_SERVER_PORT = 9002;

// Production Vercel URL for the mobile APK (realtime sync with the deployed website)
const PRODUCTION_URL = process.env.CAP_SERVER_URL || 'https://cogapp.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.cogapp.app',
  appName: 'COG App',
  webDir: 'out',
  server: {
    url: isLiveReload ? `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}` : PRODUCTION_URL,
    cleartext: isLiveReload, // HTTP allowed only during local dev; HTTPS used for production
  },
};

export default config;
