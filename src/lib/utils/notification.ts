/**
 * 안전한 알림 생성 유틸리티
 * 메인 스레드와 서비스 워커 환경을 구분하여 적절한 방법으로 알림을 생성합니다.
 */

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// 서비스 워커 환경 타입 정의
interface ServiceWorkerGlobalScope {
  importScripts: (...urls: string[]) => void;
  registration: ServiceWorkerRegistration;
}

// ServiceWorkerRegistration 확장 타입
interface ServiceWorkerNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  badge?: string;
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  showNotification: (title: string, options?: ServiceWorkerNotificationOptions) => Promise<void>;
}

/**
 * 현재 환경이 서비스 워커인지 확인
 */
export function isServiceWorkerContext(): boolean {
  return typeof self !== "undefined" && typeof window === "undefined" && typeof (self as unknown as ServiceWorkerGlobalScope).importScripts === "function";
}

/**
 * 현재 환경이 메인 스레드인지 확인
 */
export function isMainThreadContext(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * 환경에 맞는 방법으로 알림을 생성
 */
export async function createNotification(options: NotificationOptions): Promise<boolean> {
  const { title, body, icon, tag, data } = options;

  try {
    // 서비스 워커 환경
    if (isServiceWorkerContext()) {
      if ("registration" in self && self.registration) {
        await (self.registration as unknown as ExtendedServiceWorkerRegistration).showNotification(title, {
          body,
          icon,
          tag,
          data,
        });
        return true;
      }
      console.warn("서비스 워커에서 registration을 찾을 수 없습니다.");
      return false;
    }

    // 메인 스레드 환경
    if (isMainThreadContext()) {
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon,
            tag,
            data,
          });
          return true;
        } else {
          console.warn("알림 권한이 허용되지 않았습니다:", Notification.permission);
          return false;
        }
      } else {
        console.warn("이 브라우저는 Notification API를 지원하지 않습니다.");
        return false;
      }
    }

    console.warn("알 수 없는 환경에서 알림 생성을 시도했습니다.");
    return false;
  } catch (error) {
    console.error("알림 생성 중 오류:", error);
    return false;
  }
}

/**
 * 포그라운드 알림 생성 (메인 스레드 전용)
 */
export function createForegroundNotification(options: NotificationOptions): boolean {
  console.log("🔔 createForegroundNotification 호출됨:", options);

  if (!isMainThreadContext()) {
    console.warn("포그라운드 알림은 메인 스레드에서만 생성할 수 있습니다.");
    return false;
  }

  // 모바일 환경 감지
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isChrome = /Chrome/i.test(navigator.userAgent);
  const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);

  console.log("환경 정보:", {
    isMobile,
    isAndroid,
    isIOS,
    isChrome,
    isSamsung,
    isPWA,
    notificationSupported: "Notification" in window,
    permission: "Notification" in window ? Notification.permission : "N/A",
    userAgent: navigator.userAgent.substring(0, 100),
    displayMode: window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser",
    standalone: (window.navigator as { standalone?: boolean }).standalone,
  });

  try {
    // Notification API 지원 확인
    if (!("Notification" in window)) {
      console.error("❌ 이 브라우저는 Notification API를 지원하지 않습니다.");
      return false;
    }

    // 권한 상태 확인
    const permission = Notification.permission;
    console.log("알림 권한 상태:", permission);

    if (permission === "denied") {
      console.error("❌ 알림 권한이 거부되었습니다.");

      // 모바일에서 권한 거부 시 추가 정보
      if (isMobile) {
        console.log("📱 모바일 권한 거부 상황:", {
          isAndroid,
          isIOS,
          isChrome,
          isSamsung,
          isPWA,
          suggestion: isAndroid ? "Android 설정 > 앱 > 브라우저 > 알림 권한 확인" : "iOS 설정 > Safari > 알림 권한 확인",
        });
      }
      return false;
    }

    if (permission === "default") {
      console.warn("⚠️ 알림 권한이 요청되지 않았습니다.");

      // 모바일에서 권한 미요청 시 추가 정보
      if (isMobile) {
        console.log("📱 모바일 권한 미요청 상황:", {
          isAndroid,
          isIOS,
          isChrome,
          isSamsung,
          isPWA,
          suggestion: "먼저 알림 권한을 요청해야 합니다.",
        });
      }
      return false;
    }

    if (permission === "granted") {
      console.log("✅ 알림 권한이 허용되었습니다. 알림 생성 시도...");

      // tag가 제공되지 않은 경우 고유한 tag 생성
      const uniqueTag = options.tag || `foreground-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 모바일 PWA 환경에서는 아이콘 경로 조정
      let iconPath = options.icon || "/icons/icon-192x192.svg";
      if (isMobile && isPWA) {
        // PWA에서는 절대 경로 사용
        iconPath = window.location.origin + iconPath;
        console.log("모바일 PWA 환경 - 아이콘 경로 조정:", iconPath);
      }

      // 알림 개수 관리 (최대 5개까지만 유지)
      if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration
              .getNotifications()
              .then((notifications) => {
                // 포그라운드 알림만 필터링 (tag가 foreground-notification으로 시작하는 것들)
                const foregroundNotifications = notifications.filter((n) => n.tag && n.tag.startsWith("foreground-notification-"));

                // 5개 이상이면 가장 오래된 것부터 제거
                if (foregroundNotifications.length >= 5) {
                  const sortedNotifications = foregroundNotifications.sort((a, b) => (a.data?.timestamp || 0) - (b.data?.timestamp || 0));

                  // 가장 오래된 알림들 제거
                  const toRemove = sortedNotifications.slice(0, foregroundNotifications.length - 4);
                  toRemove.forEach((notification) => notification.close());
                }
              })
              .catch((err) => {
                console.warn("알림 관리 중 오류:", err);
              });
          })
          .catch((err) => {
            console.warn("서비스 워커 준비 중 오류:", err);
          });
      }

      // 모바일 환경에 최적화된 알림 옵션
      const notificationOptions = {
        title: options.title,
        body: options.body,
        icon: iconPath,
        tag: uniqueTag,
        data: {
          ...options.data,
          timestamp: Date.now(),
          notificationId: uniqueTag,
          isMobile,
          isAndroid,
          isIOS,
          isPWA,
        },
      };

      // 모바일에서 추가 옵션 설정
      const extendedOptions = {
        ...notificationOptions,
        // 모바일에서 더 잘 보이도록 추가 옵션
        requireInteraction: isMobile, // 모바일에서는 사용자가 직접 닫을 때까지 유지
        silent: false,
        // Android에서 진동 패턴 설정
        vibrate: isAndroid ? [200, 100, 200] : undefined,
        // 알림 배지 설정
        badge: isMobile ? "/icons/icon-72x72.png" : undefined,
      };

      console.log("알림 생성 옵션:", extendedOptions);

      // 알림 생성
      const notification = new Notification(options.title, extendedOptions);

      console.log("✅ 알림 생성 성공:", {
        title: options.title,
        tag: uniqueTag,
        icon: iconPath,
        isMobile,
        isAndroid,
        isIOS,
        isPWA,
        timestamp: Date.now(),
      });

      // 모바일에서 알림 이벤트 리스너 추가
      notification.onclick = () => {
        console.log("알림 클릭됨 - 모바일 환경:", { isMobile, isAndroid, isIOS });
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error("알림 오류:", error);
        console.log("알림 오류 환경 정보:", { isMobile, isAndroid, isIOS, isPWA });
      };

      notification.onshow = () => {
        console.log("알림 표시됨 - 모바일 환경:", { isMobile, isAndroid, isIOS });
      };

      notification.onclose = () => {
        console.log("알림 닫힘 - 모바일 환경:", { isMobile, isAndroid, isIOS });
      };

      // 모바일에서 알림이 실제로 표시되는지 확인
      setTimeout(() => {
        console.log("알림 상태 확인 (3초 후):", {
          notificationExists: !!notification,
          tag: notification.tag,
          title: notification.title,
          isMobile,
          isAndroid,
          isIOS,
        });
      }, 3000);

      return true;
    }

    console.error("❌ 알 수 없는 권한 상태:", permission);
    return false;
  } catch (error) {
    console.error("❌ 포그라운드 알림 생성 실패:", error);

    // 모바일에서 오류 발생 시 상세 정보
    if (isMobile) {
      console.log("📱 모바일 알림 생성 오류 상세:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "스택 없음",
        isAndroid,
        isIOS,
        isChrome,
        isSamsung,
        isPWA,
        userAgent: navigator.userAgent.substring(0, 100),
      });
    }

    return false;
  }
}
