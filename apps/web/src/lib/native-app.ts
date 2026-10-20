'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Checks if the current environment is running inside the native mobile APK (Capacitor Android/iOS).
 * Supports:
 * - Capacitor.isNativePlatform()
 * - window.Capacitor?.isNativePlatform?.()
 * - Custom User-Agent header injected by Capacitor (COGApp-Native-APK)
 * - Development/testing override via URL query parameter: ?platform=apk or ?platform=web
 */
export function isNativeMobileApp(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Manual query override for testing purposes (?platform=apk / ?platform=web)
    const searchParams = new URLSearchParams(window.location.search);
    const platformParam = searchParams.get('platform');
    if (platformParam === 'apk') return true;
    if (platformParam === 'web') return false;

    // 2. Custom User-Agent flag set in capacitor.config.ts
    if (window.navigator?.userAgent?.includes('COGApp-Native-APK')) {
      return true;
    }

    // 3. Official Capacitor native platform check
    if (Capacitor.isNativePlatform()) {
      return true;
    }

    // 4. Injected window.Capacitor object check
    const winCap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (winCap && typeof winCap.isNativePlatform === 'function') {
      return winCap.isNativePlatform();
    }
  } catch {
    // Fall back to web
  }

  return false;
}

/**
 * React hook to reactively check if running on native mobile APK vs standard web browser.
 */
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState<boolean>(false);

  useEffect(() => {
    setIsNative(isNativeMobileApp());
  }, []);

  return isNative;
}
