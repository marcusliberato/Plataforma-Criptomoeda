const PLATFORM_CLASS_NAMES = ['platform-ios', 'platform-android', 'platform-web'];

export function detectWebPlatform(userAgent = '') {
  const normalized = String(userAgent).toLowerCase();

  if (normalized.includes('iphone') || normalized.includes('ipad') || normalized.includes('ipod')) {
    return 'ios';
  }

  if (normalized.includes('android')) {
    return 'android';
  }

  return 'web';
}

export function applyWebPlatformClass() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'web';
  }

  const platform = detectWebPlatform(window.navigator?.userAgent);
  const className = `platform-${platform}`;

  document.documentElement.classList.remove(...PLATFORM_CLASS_NAMES);
  document.body.classList.remove(...PLATFORM_CLASS_NAMES);
  document.documentElement.classList.add(className);
  document.body.classList.add(className);
  document.body.dataset.runtimePlatform = platform;

  return platform;
}

