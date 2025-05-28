import { createForegroundNotification } from "./notification";

export const handleCheckFeaturesClick = () => {
  const features = {
    geolocation: typeof navigator.geolocation !== "undefined",
    notification: "Notification" in window,
    serviceWorker: "serviceWorker" in navigator,
    camera: navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia !== "undefined",
  };

  const supportedCount = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;

  createForegroundNotification({
    title: "🔧 기능 지원 상태",
    body: `${supportedCount}/${totalCount}개 기능 지원됨 - 위치: ${features.geolocation ? "✓" : "✗"}, 알림: ${features.notification ? "✓" : "✗"}, SW: ${features.serviceWorker ? "✓" : "✗"}, 카메라: ${features.camera ? "✓" : "✗"}`,
    icon: "/icons/icon-192x192.svg",
    tag: "features-notification",
  });

  console.log("지원되는 기능:", features);
};

export const handlePermissionStatusCheck = (fcmToken: string | null, notificationStatus: string, browserPermission: string) => {
  const currentPermission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unknown";
  const debugInfo = {
    browserPermission: currentPermission,
    statePermission: browserPermission,
    notificationStatus: notificationStatus,
    fcmToken: fcmToken ? "있음" : "없음",
    localStorage: localStorage.getItem("fcm-token") ? "있음" : "없음",
  };
  console.log("권한 상태 디버깅:", debugInfo);

  createForegroundNotification({
    title: "🔍 권한 상태 확인",
    body: `브라우저: ${currentPermission}, 상태: ${notificationStatus}, 토큰: ${fcmToken ? "있음" : "없음"}`,
    icon: "/icons/icon-192x192.svg",
    tag: "debug-notification",
  });
};

export const handleAPIStatusCheck = async () => {
  try {
    const response = await fetch("/api/send-notification", {
      method: "GET",
    });
    const result = await response.json();
    console.log("API 상태:", result);

    createForegroundNotification({
      title: "🔧 API 상태 확인",
      body: `${result.message} - POST 엔드포인트 사용 가능`,
      icon: "/icons/icon-192x192.svg",
      tag: "api-status-notification",
    });
  } catch (error) {
    console.error("API 상태 확인 오류:", error);
    createForegroundNotification({
      title: "❌ API 상태 확인 실패",
      body: `오류: ${error instanceof Error ? error.message : String(error)}`,
      icon: "/icons/icon-192x192.svg",
      tag: "api-error-notification",
    });
  }
};

export const handleAndroidDebugInfo = async () => {
  try {
    // Android 푸시 알림 디버깅 정보 수집
    const debugInfo: Record<string, unknown> = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isAndroid: /Android/i.test(navigator.userAgent),
      isChrome: /Chrome/i.test(navigator.userAgent),
      notificationPermission: "Notification" in window ? Notification.permission : "not supported",
      serviceWorkerSupport: "serviceWorker" in navigator,
      pushManagerSupport: "PushManager" in window,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? "configured" : "missing",
      manifestUrl: "/manifest.json",
      swUrl: "/sw.js",
    };

    // 서비스 워커 상태 확인
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        debugInfo.swRegistration = registration
          ? {
              scope: registration.scope,
              state: registration.active?.state,
              onupdatefound: registration.onupdatefound ? "present" : "none",
            }
          : "not registered";
      } catch (swError) {
        debugInfo.swRegistration = `error: ${swError instanceof Error ? swError.message : String(swError)}`;
      }
    }

    // Push Manager 상태 확인
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          debugInfo.pushSubscription = subscription ? "active" : "none";
        }
      } catch (pushError) {
        debugInfo.pushSubscription = `error: ${pushError instanceof Error ? pushError.message : String(pushError)}`;
      }
    }

    console.log("Android 푸시 알림 디버깅:", debugInfo);

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    createForegroundNotification({
      title: "🤖 Android 디버깅 정보",
      body: `Android: ${isAndroid ? "예" : "아니오"}, Chrome: ${isChrome ? "예" : "아니오"}, SW: ${debugInfo.swRegistration !== "not registered" ? "등록됨" : "미등록"}`,
      icon: "/icons/icon-192x192.svg",
      tag: "android-debug-notification",
    });
  } catch (error) {
    console.error("디버깅 정보 수집 오류:", error);
    createForegroundNotification({
      title: "❌ 디버깅 정보 수집 실패",
      body: `오류: ${error instanceof Error ? error.message : String(error)}`,
      icon: "/icons/icon-192x192.svg",
      tag: "debug-error-notification",
    });
  }
};
