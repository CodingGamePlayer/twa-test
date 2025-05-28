import { createForegroundNotification } from "./notification";

// 모바일 환경 감지
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// PWA 환경 감지
const isPWA = () => {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;
};

export const handleCheckFeaturesClick = () => {
  console.log("🔧 기능 확인하기 버튼 클릭됨");
  console.log("환경 정보:", {
    isMobile: isMobile(),
    isPWA: isPWA(),
    userAgent: navigator.userAgent,
  });

  const features = [
    `Service Worker: ${typeof navigator !== "undefined" && "serviceWorker" in navigator ? "✅" : "❌"}`,
    `Push API: ${typeof window !== "undefined" && "PushManager" in window ? "✅" : "❌"}`,
    `Notification API: ${typeof window !== "undefined" && "Notification" in window ? "✅" : "❌"}`,
    `Cache API: ${typeof window !== "undefined" && "caches" in window ? "✅" : "❌"}`,
    `IndexedDB: ${typeof window !== "undefined" && "indexedDB" in window ? "✅" : "❌"}`,
    `Mobile: ${isMobile() ? "✅" : "❌"}`,
    `PWA Mode: ${isPWA() ? "✅" : "❌"}`,
    `Notification Permission: ${typeof window !== "undefined" && "Notification" in window ? Notification.permission : "N/A"}`,
  ];

  console.log("기능 확인 결과:", features);

  try {
    const result = createForegroundNotification({
      title: "🔧 PWA 기능 지원 현황",
      body: features.join("\n"),
    });
    console.log("알림 생성 결과:", result);
  } catch (error) {
    console.error("알림 생성 오류:", error);
  }
};

export const handlePermissionStatusCheck = (fcmToken: string | null, notificationStatus: string, browserPermission: string) => {
  console.log("🔍 권한 상태 확인 버튼 클릭됨", { fcmToken, notificationStatus, browserPermission });

  // 모바일 환경 상세 감지
  const userAgent = navigator.userAgent;
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent);
  const isSamsung = /SamsungBrowser/i.test(userAgent);
  const isPWAMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;

  // 알림 API 지원 상태 확인
  const notificationSupported = "Notification" in window;
  const currentPermission = notificationSupported ? Notification.permission : "N/A";

  // 서비스 워커 상태 확인
  const serviceWorkerSupported = "serviceWorker" in navigator;
  let serviceWorkerStatus = "미지원";
  if (serviceWorkerSupported) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        console.log("서비스 워커 등록 상태:", registration.scope, registration.active?.state);
      } else {
        console.log("서비스 워커가 등록되지 않음");
      }
    });
    serviceWorkerStatus = "지원됨";
  }

  const permissionInfo = [
    `📱 모바일 디바이스: ${isMobileDevice ? "✅" : "❌"}`,
    `🤖 Android: ${isAndroid ? "✅" : "❌"}`,
    `🍎 iOS: ${isIOS ? "✅" : "❌"}`,
    `🌐 Chrome: ${isChrome ? "✅" : "❌"}`,
    `📱 Samsung Browser: ${isSamsung ? "✅" : "❌"}`,
    `📲 PWA 모드: ${isPWAMode ? "✅" : "❌"}`,
    `🔔 알림 API 지원: ${notificationSupported ? "✅" : "❌"}`,
    `🔐 현재 브라우저 권한: ${currentPermission}`,
    `🎯 FCM 토큰: ${fcmToken ? "✅ 생성됨" : "❌ 없음"}`,
    `📊 알림 상태: ${notificationStatus}`,
    `🔧 서비스 워커: ${serviceWorkerStatus}`,
  ];

  console.log("권한 상태 상세 정보:", {
    isMobileDevice,
    isAndroid,
    isIOS,
    isChrome,
    isSamsung,
    isPWAMode,
    notificationSupported,
    currentPermission,
    fcmToken: fcmToken ? "존재함" : "없음",
    notificationStatus,
    browserPermission,
    userAgent: userAgent.substring(0, 100),
  });

  // 알림 생성 전 환경 체크
  console.log("알림 생성 전 환경 체크:", {
    windowExists: typeof window !== "undefined",
    notificationInWindow: typeof window !== "undefined" && "Notification" in window,
    permission: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "N/A",
  });

  try {
    const result = createForegroundNotification({
      title: "🔍 권한 상태 확인",
      body: permissionInfo.join("\n"),
      tag: `permission-check-${Date.now()}`,
    });

    console.log("권한 상태 알림 생성 결과:", result);

    // 모바일에서 알림이 생성되지 않는 경우 추가 디버깅
    if (!result && isMobileDevice) {
      console.error("❌ 모바일에서 알림 생성 실패");
      console.log("모바일 알림 실패 원인 분석:", {
        notificationPermission: currentPermission,
        notificationSupported,
        isPWA: isPWAMode,
        isAndroid,
        isIOS,
        userAgent: userAgent.substring(0, 50),
      });

      // 대체 알림 방법 시도 (콘솔 로그)
      console.warn("🚨 모바일 알림 대체 방법:", permissionInfo.join(" | "));
    }
  } catch (error) {
    console.error("권한 상태 알림 생성 오류:", error);

    // 오류 발생 시 추가 정보 로깅
    console.log("오류 발생 시 환경 정보:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "스택 없음",
      isMobile: isMobileDevice,
      notificationSupported,
      permission: currentPermission,
    });
  }
};

export const handleAPIStatusCheck = () => {
  console.log("🔧 API 상태 확인 버튼 클릭됨");

  try {
    const apiInfo = [
      `User Agent: ${navigator.userAgent.substring(0, 50)}...`,
      `Platform: ${navigator.platform}`,
      `Language: ${navigator.language}`,
      `Online: ${navigator.onLine ? "✅" : "❌"}`,
      `Cookie Enabled: ${navigator.cookieEnabled ? "✅" : "❌"}`,
      `Mobile: ${isMobile() ? "✅" : "❌"}`,
      `PWA: ${isPWA() ? "✅" : "❌"}`,
      `Screen: ${screen.width}x${screen.height}`,
    ];

    console.log("API 상태:", apiInfo);

    const result = createForegroundNotification({
      title: "🔧 API 상태 정보",
      body: apiInfo.join("\n"),
    });
    console.log("API 상태 알림 생성 결과:", result);
  } catch (error) {
    console.error("API 상태 확인 오류:", error);
    createForegroundNotification({
      title: "❌ API 확인 오류",
      body: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};

export const handleAndroidDebugInfo = () => {
  console.log("🤖 Android 디버깅 정보 버튼 클릭됨");

  try {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);

    const androidInfo = [
      `Android: ${isAndroid ? "✅" : "❌"}`,
      `Chrome: ${isChrome ? "✅" : "❌"}`,
      `Samsung Browser: ${isSamsung ? "✅" : "❌"}`,
      `Standalone: ${isPWA() ? "✅" : "❌"}`,
      `PWA: ${typeof window !== "undefined" && (window.navigator as { standalone?: boolean }).standalone ? "✅" : "❌"}`,
      `Mobile: ${isMobile() ? "✅" : "❌"}`,
      `Notification Permission: ${typeof window !== "undefined" && "Notification" in window ? Notification.permission : "N/A"}`,
    ];

    console.log("Android 디버깅 정보:", androidInfo);

    const result = createForegroundNotification({
      title: "🤖 Android 디버깅 정보",
      body: androidInfo.join("\n"),
    });
    console.log("Android 디버깅 알림 생성 결과:", result);
  } catch (error) {
    console.error("Android 디버깅 정보 오류:", error);
    createForegroundNotification({
      title: "❌ 디버깅 정보 오류",
      body: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};
