import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fumiga.project',
  appName: 'FUMIGA Project',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  server: { cleartext: true },
  android: { allowMixedContent: true },
};

export default config;
