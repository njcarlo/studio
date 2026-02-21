import type { CapacitorConfig } from '@capacitor/cli';

const isLiveReload = process.env.CAP_LIVE_RELOAD === 'true';

// Your machine's local IP — keep this updated if your IP changes
const DEV_SERVER_IP = '192.168.1.246';
const DEV_SERVER_PORT = 9002;

const config: CapacitorConfig = {
  appId: 'com.cogapp.app',
  appName: 'COGApp',
  webDir: 'out',
  ...(isLiveReload && {
    server: {
      url: `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}`,
      cleartext: true, // Allow HTTP traffic for dev (Android blocks it by default)
    },
  }),
};

export default config;
