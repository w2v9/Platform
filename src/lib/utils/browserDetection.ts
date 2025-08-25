export interface BrowserInfo {
  isInAppBrowser: boolean;
  isTelegram: boolean;
  isWhatsApp: boolean;
  isFacebook: boolean;
  isInstagram: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  supportsModernJS: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  supportsIndexedDB: boolean;
  userAgent: string;
  recommendedAction: string;
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent || '';
  const isInAppBrowser = detectInAppBrowser(userAgent);
  const isTelegram = userAgent.includes('TelegramWebApp') || userAgent.includes('Telegram');
  const isWhatsApp = userAgent.includes('WhatsApp');
  const isFacebook = userAgent.includes('FBAN') || userAgent.includes('FBAV');
  const isInstagram = userAgent.includes('Instagram');
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edge/.test(userAgent);

  // Test for modern JavaScript features
  const supportsModernJS = testModernJavaScript();
  const supportsLocalStorage = testLocalStorage();
  const supportsSessionStorage = testSessionStorage();
  const supportsIndexedDB = testIndexedDB();

  // Determine recommended action
  let recommendedAction = 'Continue with current browser';
  if (isInAppBrowser && !supportsModernJS) {
    recommendedAction = 'Open in Safari or Chrome for best experience';
  } else if (isInAppBrowser) {
    recommendedAction = 'Consider opening in Safari for better performance';
  }

  return {
    isInAppBrowser,
    isTelegram,
    isWhatsApp,
    isFacebook,
    isInstagram,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    supportsModernJS,
    supportsLocalStorage,
    supportsSessionStorage,
    supportsIndexedDB,
    userAgent,
    recommendedAction
  };
}

function detectInAppBrowser(userAgent: string): boolean {
  const inAppPatterns = [
    'TelegramWebApp',
    'FBAN',
    'FBAV',
    'Instagram',
    'WhatsApp',
    'Line',
    'WeChat',
    'KakaoTalk',
    'Snapchat',
    'TikTok',
    'Discord',
    'Slack',
    'Teams',
    'Zoom'
  ];

  return inAppPatterns.some(pattern => userAgent.includes(pattern));
}

function testModernJavaScript(): boolean {
  try {
    // Test for modern JS features
    const testFeatures = [
      () => typeof Promise !== 'undefined',
      () => typeof fetch !== 'undefined',
      () => typeof Array.from !== 'undefined',
      () => typeof Object.assign !== 'undefined',
      () => typeof Symbol !== 'undefined',
      () => typeof Map !== 'undefined',
      () => typeof Set !== 'undefined',
      () => typeof WeakMap !== 'undefined',
      () => typeof WeakSet !== 'undefined',
      () => typeof Proxy !== 'undefined',
      () => typeof Reflect !== 'undefined',
      () => typeof Intl !== 'undefined'
    ];

    return testFeatures.every(test => test());
  } catch {
    return false;
  }
}

function testLocalStorage(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function testSessionStorage(): boolean {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function testIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

export function getBrowserWarningMessage(browserInfo: BrowserInfo): string | null {
  if (!browserInfo.isInAppBrowser) {
    return null;
  }

  if (!browserInfo.supportsModernJS) {
    return 'Your current browser may not support all features. For the best experience, please open this page in Safari or Chrome.';
  }

  if (browserInfo.isTelegram) {
    return 'You\'re using Telegram\'s in-app browser. For optimal performance, tap the Safari icon to open in Safari.';
  }

  return 'You\'re using an in-app browser. For the best experience, consider opening this page in Safari or Chrome.';
}

export function shouldShowBrowserWarning(browserInfo: BrowserInfo): boolean {
  return browserInfo.isInAppBrowser && !browserInfo.supportsModernJS;
}
