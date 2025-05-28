import { useState, useEffect } from "react";
import { createForegroundNotification } from "@/lib/utils/notification";

// PWA 설치 이벤트에 대한 타입 정의
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Navigator 인터페이스 확장
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export function usePWA() {
  const [installStatus, setInstallStatus] = useState("설치 상태를 확인하는 중...");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showCustomBanner, setShowCustomBanner] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  useEffect(() => {
    // PWA 설치 상태 확인
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
      setInstallStatus("설치된 앱으로 실행 중");
    } else {
      setInstallStatus("브라우저에서 실행 중");
    }

    // PWA 설치 조건 디버깅
    const checkPWAConditions = () => {
      const conditions = {
        isHttps: window.location.protocol === "https:" || window.location.hostname === "localhost",
        hasServiceWorker: "serviceWorker" in navigator,
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        isChrome: /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent),
        isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
        beforeInstallPromptFired: !!deferredPrompt,
        isStandalone: window.matchMedia("(display-mode: standalone)").matches,
        hasMinimalUI: window.matchMedia("(display-mode: minimal-ui)").matches,
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      };

      const debugText = `PWA 설치 조건 확인:
• HTTPS/localhost: ${conditions.isHttps ? "✓" : "✗"}
• 서비스 워커: ${conditions.hasServiceWorker ? "✓" : "✗"}
• 웹 매니페스트: ${conditions.hasManifest ? "✓" : "✗"}
• Chrome 브라우저: ${conditions.isChrome ? "✓" : "✗"}
• iOS Safari: ${conditions.isIOS && conditions.isSafari ? "✓" : "✗"}
• 모바일 기기: ${conditions.isMobile ? "✓" : "✗"}
• beforeinstallprompt 이벤트: ${conditions.beforeInstallPromptFired ? "✓" : "✗"}
• 이미 설치됨: ${conditions.isStandalone ? "✓" : "✗"}
• URL: ${window.location.href}

추가 정보:
• User Agent: ${navigator.userAgent}
• 화면 모드: ${window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser"}`;

      setDebugInfo(debugText);
      console.log("PWA 설치 조건:", conditions);
    };

    checkPWAConditions();

    // 설치 버튼 이벤트 처리
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt 이벤트 발생!", e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallStatus("설치 가능");
      setShowCustomBanner(false);
      checkPWAConditions();
    };

    // 앱 설치 완료 감지
    const handleAppInstalled = () => {
      console.log("앱이 설치되었습니다!");
      setInstallStatus("설치된 앱으로 실행 중");
      setDeferredPrompt(null);
      createForegroundNotification({
        title: "🎉 설치 완료!",
        body: "TWA 테스트 앱이 성공적으로 설치되었습니다!",
        icon: "/icons/icon-192x192.svg",
        tag: "app-installed",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // 브라우저별 설치 안내
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

      if (isIOS && isSafari) {
        setShowIOSInstallGuide(true);
      } else if (isChrome && !isMobile) {
        createForegroundNotification({
          title: "💻 데스크톱 Chrome 설치 안내",
          body: "주소창 오른쪽의 설치 아이콘(⊕)을 클릭하거나 메뉴에서 '앱 설치'를 선택하세요.",
          icon: "/icons/icon-192x192.svg",
          tag: "install-guide-desktop",
        });
      } else if (isMobile && isChrome) {
        createForegroundNotification({
          title: "📱 모바일 Chrome 설치 안내",
          body: "메뉴(⋮)에서 '홈 화면에 추가'를 선택하거나 하단 설치 배너를 사용하세요.",
          icon: "/icons/icon-192x192.svg",
          tag: "install-guide-mobile",
        });
      } else if (isIOS) {
        setShowIOSInstallGuide(true);
      } else {
        createForegroundNotification({
          title: "⚠️ 브라우저 호환성",
          body: "PWA 설치를 위해 Chrome 브라우저 또는 iOS Safari를 사용해주세요.",
          icon: "/icons/icon-192x192.svg",
          tag: "browser-compatibility",
        });
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`사용자 선택: ${outcome}`);
      setDeferredPrompt(null);
      setShowCustomBanner(false);

      // 설치 결과 알림
      if (outcome === "accepted") {
        createForegroundNotification({
          title: "✅ 앱 설치 완료",
          body: "TWA 테스트 앱이 성공적으로 설치되었습니다!",
          icon: "/icons/icon-192x192.svg",
          tag: "install-success",
        });
      } else {
        createForegroundNotification({
          title: "ℹ️ 설치 취소됨",
          body: "앱 설치가 취소되었습니다. 언제든지 다시 설치할 수 있습니다.",
          icon: "/icons/icon-192x192.svg",
          tag: "install-cancelled",
        });
      }
    } catch (error) {
      console.error("설치 프롬프트 오류:", error);
      createForegroundNotification({
        title: "❌ 설치 오류",
        body: `설치 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        icon: "/icons/icon-192x192.svg",
        tag: "install-error",
      });
    }
  };

  return {
    installStatus,
    deferredPrompt,
    debugInfo,
    showCustomBanner,
    setShowCustomBanner,
    showIOSInstallGuide,
    setShowIOSInstallGuide,
    handleInstallClick,
  };
}
