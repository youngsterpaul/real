import { Capacitor } from '@capacitor/core';

export const useIsCapacitor = () => {
  return Capacitor.isNativePlatform();
};
