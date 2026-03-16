import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meenuin.app',
  appName: 'Meenuin',
  webDir: 'out',
  server: {
    url: 'https://meenuin.biz.id/login',
    cleartext: true
  }
};

export default config;
