"use client";

import { useState, useEffect } from "react";

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

export default function Home() {
  const [deviceInfo, setDeviceInfo] = useState("디바이스 정보를 불러오는 중...");
  const [installStatus, setInstallStatus] = useState("설치 상태를 확인하는 중...");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showCustomBanner, setShowCustomBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // 빌드 시간과 버전 정보 (환경 변수에서 가져오기)
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const buildVersion = process.env.BUILD_VERSION || `v1.0.${Math.floor(Date.now() / 1000)}`;

  useEffect(() => {
    // 현재 시간 업데이트
    const updateCurrentTime = () => {
      setCurrentTime(
        new Date().toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Seoul",
        })
      );
    };

    updateCurrentTime();
    const timeInterval = setInterval(updateCurrentTime, 1000);

    // ESC 키로 다이얼로그 닫기
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showCustomBanner) {
          setShowCustomBanner(false);
        }
        if (showIOSInstallGuide) {
          setShowIOSInstallGuide(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);

    // 디바이스 정보 표시
    setDeviceInfo(navigator.userAgent);

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

      // beforeinstallprompt가 5초 후에도 발생하지 않으면 커스텀 배너 표시
      if (!conditions.beforeInstallPromptFired && !conditions.isStandalone) {
        setTimeout(() => {
          if (!deferredPrompt) {
            console.log("beforeinstallprompt 이벤트가 발생하지 않아 커스텀 배너를 표시합니다.");
            // iOS Safari인 경우 iOS 전용 가이드 표시
            if (conditions.isIOS && conditions.isSafari) {
              setShowIOSInstallGuide(true);
            } else {
              setShowCustomBanner(true);
            }
          }
        }, 5000);
      }
    };

    checkPWAConditions();

    // 설치 버튼 이벤트 처리
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt 이벤트 발생!", e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallStatus("설치 가능 (프롬프트 준비됨)");
      setShowCustomBanner(false); // 실제 프롬프트가 있으면 커스텀 배너 숨김
      checkPWAConditions(); // 상태 업데이트
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearInterval(timeInterval);
      document.removeEventListener("keydown", handleEscKey);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [deferredPrompt, showCustomBanner, showIOSInstallGuide]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // 브라우저별 설치 안내
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

      if (isIOS && isSafari) {
        // iOS Safari에서는 시각적 가이드 표시
        setShowIOSInstallGuide(true);
      } else if (isChrome && !isMobile) {
        alert(`데스크톱 Chrome에서 PWA 설치하기:
1. 주소창 오른쪽의 설치 아이콘(⊕)을 클릭하거나
2. 메뉴(⋮) > 앱 설치 > "TWA Test App 설치"를 선택하세요.

현재 beforeinstallprompt 이벤트가 발생하지 않았습니다.
페이지를 새로고침하거나 잠시 후 다시 시도해보세요.`);
      } else if (isMobile && isChrome) {
        alert(`모바일 Chrome에서 PWA 설치하기:
1. 메뉴(⋮) > "홈 화면에 추가"를 선택하거나
2. 하단에 나타나는 설치 배너를 사용하세요.

현재 beforeinstallprompt 이벤트가 발생하지 않았습니다.`);
      } else if (isIOS) {
        setShowIOSInstallGuide(true);
      } else {
        alert("PWA 설치를 위해 Chrome 브라우저 또는 iOS Safari를 사용해주세요.");
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`사용자 선택: ${outcome}`);
      setDeferredPrompt(null);
      setShowCustomBanner(false);
    } catch (error) {
      console.error("설치 프롬프트 오류:", error);
      alert("설치 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCheckFeaturesClick = () => {
    const features = [
      `Geolocation: ${typeof navigator.geolocation !== "undefined" ? "지원됨" : "지원되지 않음"}`,
      `Notification: ${"Notification" in window ? "지원됨" : "지원되지 않음"}`,
      `Service Worker: ${"serviceWorker" in navigator ? "지원됨" : "지원되지 않음"}`,
      `Camera: ${navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia !== "undefined" ? "지원됨" : "지원되지 않음"}`,
    ].join("\n");

    alert("지원되는 기능:\n" + features);
  };

  // 강제로 설치 프롬프트 테스트
  const forceInstallPrompt = () => {
    // 실제 beforeinstallprompt 이벤트가 있는지 확인
    if (deferredPrompt) {
      handleInstallClick();
    } else {
      // 커스텀 배너 표시
      setShowCustomBanner(true);
      alert("beforeinstallprompt 이벤트가 발생하지 않았습니다. 커스텀 설치 안내를 표시합니다.");
    }
  };

  // 페이지 새로고침
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 설치 다이얼로그 모달 */}
      {showCustomBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
            // 배경 클릭 시 다이얼로그 닫기
            if (e.target === e.currentTarget) {
              setShowCustomBanner(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-slideUp">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-center mb-2 text-gray-800 dark:text-white">앱 설치하기</h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">이 앱을 홈 화면에 설치하여 더 빠르고 편리하게 사용하세요!</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomBanner(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                나중에
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                설치하기
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">ESC 키를 눌러 닫을 수 있습니다</p>
          </div>
        </div>
      )}

      {/* iOS Safari 설치 가이드 모달 */}
      {showIOSInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowIOSInstallGuide(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-slideUp">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">🍎</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-center mb-2 text-gray-800 dark:text-white">iOS에서 앱 설치하기</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📤</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">1. 공유 버튼 탭</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">하단의 공유 버튼(📤)을 탭하세요</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">➕</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">2. &quot;홈 화면에 추가&quot; 선택</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">메뉴에서 &quot;홈 화면에 추가&quot;를 찾아 탭하세요</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">3. &quot;추가&quot; 버튼 탭</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">앱 이름을 확인하고 &quot;추가&quot;를 탭하세요</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              확인했습니다
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">설치 후 홈 화면에서 앱을 실행할 수 있습니다</p>
          </div>
        </div>
      )}

      <main className="flex flex-col items-center max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">TWA 테스트 애플리케이션</h1>

        {/* 업데이트 시간 정보 */}
        <div className="w-full p-3 mb-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-indigo-700 dark:text-indigo-300">버전 정보</h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>
              빌드 시간:{" "}
              {new Date(buildTime).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Seoul",
              })}
            </div>
            <div>현재 시간: {currentTime}</div>
            <div className="text-indigo-600 dark:text-indigo-400">버전: {buildVersion}</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              마지막 새로고침:{" "}
              {new Date().toLocaleString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>

        <div className="w-full p-4 mb-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">Trusted Web Activity 정보</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            이 앱은 PWA 및 TWA 테스트를 위해 설계되었습니다. Android에서 TWA로 설치하여 네이티브 앱처럼 실행할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <h3 className="text-md font-medium mb-2 text-green-700 dark:text-green-300">디바이스 정보</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400" id="device-info">
              {deviceInfo}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <h3 className="text-md font-medium mb-2 text-purple-700 dark:text-purple-300">설치 상태</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400" id="install-status">
              {installStatus}
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            id="install-button"
            onClick={handleInstallClick}
          >
            앱 설치하기
          </button>
          <button
            className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
            id="check-features"
            onClick={handleCheckFeaturesClick}
          >
            기능 확인하기
          </button>
          <button className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors" onClick={forceInstallPrompt}>
            설치 프롬프트 강제 실행
          </button>
          <button className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors" onClick={refreshPage}>
            🔄 페이지 새로고침
          </button>
        </div>

        {/* 디버깅 정보 표시 */}
        <div className="w-full mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">PWA 설치 디버깅 정보</h3>
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      </main>

      <footer className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© 2024 TWA 테스트 애플리케이션</p>
      </footer>
    </div>
  );
}
