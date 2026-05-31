import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.repazy.app',
  appName: 'repazy',
  webDir: 'public',
  android: {
    backgroundColor: '#050510',
  },
  server: {
    url: 'https://repazy.com/login?native_shell=1',
    cleartext: true
  },
  plugins: {
    Badge: {
      persist: true,
      autoClear: false,
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: '#050510',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
      androidSplashResourceName: 'splash',
    },
  }
};

export default config;
