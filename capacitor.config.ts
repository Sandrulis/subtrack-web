import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.repazy.app',
  appName: 'repazy',
  webDir: 'public',
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
      launchShowDuration: 2000,
      backgroundColor: '#00a38d',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
