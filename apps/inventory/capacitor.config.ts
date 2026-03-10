import type { CapacitorConfig } from '@capacitor/cli';

const isLiveReload = process.env.CAP_LIVE_RELOAD === 'true';

// Your machine's local IP — update this if your IP changes
const DEV_SERVER_IP = '192.168.1.246';
const DEV_SERVER_PORT = 5173; // Vite default port

const config: CapacitorConfig = {
  appId: 'com.studio.inventory',
  appName: 'Inventory',
  webDir: 'dist',
  ...(isLiveReload && {
    server: {
      url: `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}`,
      cleartext: true,
    },
  }),
};

export default config;
