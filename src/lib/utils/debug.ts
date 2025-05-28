import { createForegroundNotification } from "./notification";

export const handleCheckFeaturesClick = () => {
  const features = [
    `Service Worker: ${typeof navigator !== "undefined" && "serviceWorker" in navigator ? "✅" : "❌"}`,
    `Push API: ${typeof window !== "undefined" && "PushManager" in window ? "✅" : "❌"}`,
    `Notification API: ${typeof window !== "undefined" && "Notification" in window ? "✅" : "❌"}`,
    `Cache API: ${typeof window !== "undefined" && "caches" in window ? "✅" : "❌"}`,
    `IndexedDB: ${typeof window !== "undefined" && "indexedDB" in window ? "✅" : "❌"}`,
  ];

  createForegroundNotification({
    title: "🔧 PWA 기능 지원 현황",
    body: features.join("\n"),
  });
};

export const handlePermissionStatusCheck = (fcmToken: string | null, notificationStatus: string, browserPermission: string) => {
  const permissionInfo = [
    `FCM 토큰: ${fcmToken ? "✅ 생성됨" : "❌ 없음"}`,
    `알림 상태: ${notificationStatus}`,
    `브라우저 권한: ${browserPermission}`,
    `서비스 워커: ${typeof navigator !== "undefined" && navigator.serviceWorker ? "✅ 지원됨" : "❌ 미지원"}`,
  ];

  createForegroundNotification({
    title: "🔍 권한 상태 확인",
    body: permissionInfo.join("\n"),
  });
};

export const handleAPIStatusCheck = () => {
  try {
    const apiInfo = [
      `User Agent: ${navigator.userAgent.substring(0, 50)}...`,
      `Platform: ${navigator.platform}`,
      `Language: ${navigator.language}`,
      `Online: ${navigator.onLine ? "✅" : "❌"}`,
      `Cookie Enabled: ${navigator.cookieEnabled ? "✅" : "❌"}`,
    ];

    createForegroundNotification({
      title: "🔧 API 상태 정보",
      body: apiInfo.join("\n"),
    });
  } catch (error) {
    createForegroundNotification({
      title: "❌ API 확인 오류",
      body: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};

export const handleAndroidDebugInfo = () => {
  try {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);

    const androidInfo = [
      `Android: ${isAndroid ? "✅" : "❌"}`,
      `Chrome: ${isChrome ? "✅" : "❌"}`,
      `Samsung Browser: ${isSamsung ? "✅" : "❌"}`,
      `Standalone: ${typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches ? "✅" : "❌"}`,
      `PWA: ${typeof window !== "undefined" && window.navigator.standalone ? "✅" : "❌"}`,
    ];

    createForegroundNotification({
      title: "🤖 Android 디버깅 정보",
      body: androidInfo.join("\n"),
    });
  } catch (error) {
    createForegroundNotification({
      title: "❌ 디버깅 정보 오류",
      body: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};
