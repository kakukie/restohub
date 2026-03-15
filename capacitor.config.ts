import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meenuin.app',
  appName: 'Meenuin',
  webDir: 'out',
  server: {
    url: 'https://admin.meenuin.com',
    cleartext: true
  }
};

export default config;
