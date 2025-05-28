"use client";

import InstallGuideModal from "@/components/InstallGuideModal";
import NotificationStatus from "@/components/NotificationStatus";
import VersionInfo from "@/components/VersionInfo";
import { useNotification } from "@/hooks/useNotification";
import { usePWA } from "@/hooks/usePWA";
import { useTime } from "@/hooks/useTime";
import { useEffect, useState } from "react";

export default function Home() {
  const [deviceInfo, setDeviceInfo] = useState("디바이스 정보를 불러오는 중...");
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionDialogData, setPermissionDialogData] = useState<string[]>([]);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [apiDialogData, setApiDialogData] = useState<string[]>([]);
  const [showAndroidDialog, setShowAndroidDialog] = useState(false);
  const [androidDialogData, setAndroidDialogData] = useState<string[]>([]);
  const [showFeaturesDialog, setShowFeaturesDialog] = useState(false);
  const [featuresDialogData, setFeaturesDialogData] = useState<string[]>([]);

  // 커스텀 훅 사용
  const { installStatus, deferredPrompt, debugInfo, showCustomBanner, setShowCustomBanner, showIOSInstallGuide, setShowIOSInstallGuide, handleInstallClick } =
    usePWA();

  const {
    fcmToken,
    notificationStatus,
    isNotificationLoading,
    browserPermission,
    requestNotificationPermissionHandler,
    sendTestNotification,
    sendBroadcastNotification,
  } = useNotification();

  const { currentTime, isClient, buildVersion, formatBuildTime, getRefreshTime } = useTime();

  useEffect(() => {
    // 디바이스 정보 표시
    setDeviceInfo(navigator.userAgent);

    // ESC 키로 다이얼로그 닫기
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showCustomBanner) {
          setShowCustomBanner(false);
        }
        if (showIOSInstallGuide) {
          setShowIOSInstallGuide(false);
        }
        if (showPermissionDialog) {
          setShowPermissionDialog(false);
        }
        if (showApiDialog) {
          setShowApiDialog(false);
        }
        if (showAndroidDialog) {
          setShowAndroidDialog(false);
        }
        if (showFeaturesDialog) {
          setShowFeaturesDialog(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [
    showCustomBanner,
    showIOSInstallGuide,
    setShowCustomBanner,
    setShowIOSInstallGuide,
    showPermissionDialog,
    setShowPermissionDialog,
    showApiDialog,
    setShowApiDialog,
    showAndroidDialog,
    setShowAndroidDialog,
    showFeaturesDialog,
    setShowFeaturesDialog,
  ]);

  // 디버깅 메시지 추가 함수
  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("ko-KR");
    const formattedMessage = `[${timestamp}] ${message}`;
    setDebugMessages((prev) => [...prev.slice(-9), formattedMessage]); // 최대 10개 메시지 유지
    console.log(formattedMessage);
  };

  // 페이지 새로고침
  const refreshPage = () => {
    window.location.reload();
  };

  // 권한 상태 확인 핸들러 (디버깅 메시지 추가)
  const handlePermissionStatusCheckWithDebug = () => {
    addDebugMessage("🔍 권한 상태 확인 버튼 클릭됨");

    try {
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
      const serviceWorkerStatus = serviceWorkerSupported ? "지원됨" : "미지원";

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
        `🌍 User Agent: ${userAgent.substring(0, 80)}...`,
      ];

      // 다이얼로그 데이터 설정 및 표시
      setPermissionDialogData(permissionInfo);
      setShowPermissionDialog(true);

      addDebugMessage(`📱 모바일: ${isMobileDevice ? "예" : "아니오"}, 알림지원: ${notificationSupported ? "예" : "아니오"}, 권한: ${currentPermission}`);
      addDebugMessage("✅ 권한 상태 확인 완료 - 다이얼로그 표시됨");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage(`❌ 권한 상태 확인 오류: ${errorMessage}`);
    }
  };

  // API 상태 확인 핸들러 (디버깅 메시지 추가)
  const handleAPIStatusCheckWithDebug = () => {
    addDebugMessage("🔧 API 상태 확인 버튼 클릭됨");

    try {
      const apiInfo = [
        `🌍 User Agent: ${navigator.userAgent.substring(0, 80)}...`,
        `💻 Platform: ${navigator.platform}`,
        `🗣️ Language: ${navigator.language}`,
        `🌐 Online: ${navigator.onLine ? "✅" : "❌"}`,
        `🍪 Cookie Enabled: ${navigator.cookieEnabled ? "✅" : "❌"}`,
        `📱 Mobile: ${/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? "✅" : "❌"}`,
        `📲 PWA: ${window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true ? "✅" : "❌"}`,
        `📺 Screen: ${screen.width}x${screen.height}`,
        `🎨 Color Depth: ${screen.colorDepth}bit`,
        `⏰ Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `🔧 Service Worker: ${"serviceWorker" in navigator ? "✅" : "❌"}`,
        `💾 Local Storage: ${typeof Storage !== "undefined" ? "✅" : "❌"}`,
      ];

      setApiDialogData(apiInfo);
      setShowApiDialog(true);
      addDebugMessage("✅ API 상태 확인 완료 - 다이얼로그 표시됨");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage(`❌ API 상태 확인 오류: ${errorMessage}`);
    }
  };

  // Android 디버깅 정보 핸들러 (디버깅 메시지 추가)
  const handleAndroidDebugInfoWithDebug = () => {
    addDebugMessage("🤖 Android 디버깅 정보 버튼 클릭됨");

    try {
      const userAgent = navigator.userAgent;
      const isAndroid = /Android/i.test(userAgent);
      const isChrome = /Chrome/i.test(userAgent);
      const isSamsung = /SamsungBrowser/i.test(userAgent);
      const isFirefox = /Firefox/i.test(userAgent);
      const isEdge = /Edge/i.test(userAgent);
      const isPWAMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;

      const androidInfo = [
        `🤖 Android: ${isAndroid ? "✅" : "❌"}`,
        `🌐 Chrome: ${isChrome ? "✅" : "❌"}`,
        `📱 Samsung Browser: ${isSamsung ? "✅" : "❌"}`,
        `🦊 Firefox: ${isFirefox ? "✅" : "❌"}`,
        `🔷 Edge: ${isEdge ? "✅" : "❌"}`,
        `📲 PWA 모드: ${isPWAMode ? "✅" : "❌"}`,
        `📱 Standalone: ${(window.navigator as { standalone?: boolean }).standalone ? "✅" : "❌"}`,
        `📱 Mobile: ${/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ? "✅" : "❌"}`,
        `🔔 Notification Permission: ${"Notification" in window ? Notification.permission : "N/A"}`,
        `🔧 Service Worker: ${"serviceWorker" in navigator ? "✅" : "❌"}`,
        `📳 Vibration API: ${"vibrate" in navigator ? "✅" : "❌"}`,
        `📍 Geolocation: ${"geolocation" in navigator ? "✅" : "❌"}`,
        `🌍 User Agent: ${userAgent}`,
      ];

      setAndroidDialogData(androidInfo);
      setShowAndroidDialog(true);
      addDebugMessage("✅ Android 디버깅 정보 확인 완료 - 다이얼로그 표시됨");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage(`❌ Android 디버깅 정보 오류: ${errorMessage}`);
    }
  };

  // 기능 확인 핸들러 (디버깅 메시지 추가)
  const handleCheckFeaturesClickWithDebug = () => {
    addDebugMessage("기능 확인하기 버튼 클릭됨");

    try {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isPWAMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;

      const features = [
        `🔧 Service Worker: ${typeof navigator !== "undefined" && "serviceWorker" in navigator ? "✅" : "❌"}`,
        `📤 Push API: ${typeof window !== "undefined" && "PushManager" in window ? "✅" : "❌"}`,
        `🔔 Notification API: ${typeof window !== "undefined" && "Notification" in window ? "✅" : "❌"}`,
        `💾 Cache API: ${typeof window !== "undefined" && "caches" in window ? "✅" : "❌"}`,
        `🗄️ IndexedDB: ${typeof window !== "undefined" && "indexedDB" in window ? "✅" : "❌"}`,
        `📱 Mobile: ${isMobileDevice ? "✅" : "❌"}`,
        `📲 PWA Mode: ${isPWAMode ? "✅" : "❌"}`,
        `🔐 Notification Permission: ${typeof window !== "undefined" && "Notification" in window ? Notification.permission : "N/A"}`,
        `🌐 Online: ${navigator.onLine ? "✅" : "❌"}`,
        `🍪 Cookies: ${navigator.cookieEnabled ? "✅" : "❌"}`,
      ];

      setFeaturesDialogData(features);
      setShowFeaturesDialog(true);
      addDebugMessage("✅ 기능 확인 완료 - 다이얼로그 표시됨");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage(`❌ 기능 확인 오류: ${errorMessage}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 설치 다이얼로그 모달 */}
      {showCustomBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
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
      <InstallGuideModal showIOSInstallGuide={showIOSInstallGuide} setShowIOSInstallGuide={setShowIOSInstallGuide} />

      {/* 권한 상태 확인 다이얼로그 모달 */}
      {showPermissionDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPermissionDialog(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 transform transition-all animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">🔍 권한 상태 확인</h3>
              <button onClick={() => setShowPermissionDialog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              {permissionDialogData.map((info, index) => (
                <div key={`permission-${index}`} className="py-2 px-3 bg-gray-50 dark:bg-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{info || ""}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(permissionDialogData.join("\n"))
                    .then(() => {
                      addDebugMessage("📋 권한 정보가 클립보드에 복사되었습니다");
                    })
                    .catch(() => {
                      addDebugMessage("❌ 클립보드 복사 실패");
                    });
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                📋 복사
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">ESC 키를 눌러 닫을 수 있습니다</p>
          </div>
        </div>
      )}

      {/* API 상태 확인 다이얼로그 모달 */}
      {showApiDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApiDialog(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 transform transition-all animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">🔧 API 상태 확인</h3>
              <button onClick={() => setShowApiDialog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              {apiDialogData.map((info, index) => (
                <div key={`api-${index}`} className="py-2 px-3 bg-gray-50 dark:bg-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{info || ""}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApiDialog(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(apiDialogData.join("\n"))
                    .then(() => {
                      addDebugMessage("📋 API 정보가 클립보드에 복사되었습니다");
                    })
                    .catch(() => {
                      addDebugMessage("❌ 클립보드 복사 실패");
                    });
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                📋 복사
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">ESC 키를 눌러 닫을 수 있습니다</p>
          </div>
        </div>
      )}

      {/* Android 디버깅 정보 다이얼로그 모달 */}
      {showAndroidDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAndroidDialog(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 transform transition-all animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">🤖 Android 디버깅 정보</h3>
              <button onClick={() => setShowAndroidDialog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              {androidDialogData.map((info, index) => (
                <div key={`android-${index}`} className="py-2 px-3 bg-gray-50 dark:bg-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{info || ""}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAndroidDialog(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(androidDialogData.join("\n"))
                    .then(() => {
                      addDebugMessage("📋 Android 정보가 클립보드에 복사되었습니다");
                    })
                    .catch(() => {
                      addDebugMessage("❌ 클립보드 복사 실패");
                    });
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                📋 복사
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">ESC 키를 눌러 닫을 수 있습니다</p>
          </div>
        </div>
      )}

      {/* 기능 확인 다이얼로그 모달 */}
      {showFeaturesDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeaturesDialog(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 transform transition-all animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">🔧 기능 확인</h3>
              <button onClick={() => setShowFeaturesDialog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              {featuresDialogData.map((info, index) => (
                <div key={`features-${index}`} className="py-2 px-3 bg-gray-50 dark:bg-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{info || ""}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFeaturesDialog(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(featuresDialogData.join("\n"))
                    .then(() => {
                      addDebugMessage("📋 기능 정보가 클립보드에 복사되었습니다");
                    })
                    .catch(() => {
                      addDebugMessage("❌ 클립보드 복사 실패");
                    });
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                📋 복사
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">ESC 키를 눌러 닫을 수 있습니다</p>
          </div>
        </div>
      )}

      <main className="flex flex-col items-center max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">PWA 테스트 애플리케이션</h1>

        {/* 버전 정보 */}
        <VersionInfo
          buildVersion={buildVersion}
          currentTime={currentTime}
          isClient={isClient}
          formatBuildTime={formatBuildTime}
          getRefreshTime={getRefreshTime}
        />

        <div className="w-full p-4 mb-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">PWA 정보</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">이 앱은 PWA 테스트를 위해 설계되었습니다.</p>
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
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {installStatus === "설치된 앱으로 실행 중" && "✅"}
                {installStatus === "설치 가능" && "🔄"}
                {installStatus === "브라우저에서 실행 중" && "🌐"}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400" id="install-status">
                {installStatus}
              </p>
            </div>
            {installStatus === "설치 가능" && deferredPrompt && <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">설치 프롬프트 준비됨</p>}
          </div>
        </div>

        {/* FCM 알림 상태 */}
        <NotificationStatus notificationStatus={notificationStatus} fcmToken={fcmToken} browserPermission={browserPermission} />

        <div className="w-full flex flex-col gap-3">
          {/* PWA 설치 버튼 - 설치 상태에 따라 동적 표시 */}
          {(installStatus === "브라우저에서 실행 중" || installStatus === "설치 가능") && (
            <button
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              id="install-button"
              onClick={handleInstallClick}
            >
              <span>📱</span>
              {installStatus === "설치 가능" && deferredPrompt ? "앱 설치하기" : "설치 가이드 보기"}
            </button>
          )}

          {/* 이미 설치된 경우 상태 표시 */}
          {installStatus === "설치된 앱으로 실행 중" && (
            <div className="w-full py-3 px-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-medium rounded-lg flex items-center justify-center gap-2">
              <span>✅</span>
              앱이 설치되어 실행 중입니다
            </div>
          )}

          <button
            className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
            id="check-features"
            onClick={handleCheckFeaturesClickWithDebug}
          >
            기능 확인하기
          </button>

          {/* FCM 알림 버튼들 */}
          <div className="w-full border-t pt-3 mt-3">
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">🔔 푸시 알림 테스트</h3>
            <div className="space-y-2">
              {!fcmToken ? (
                <button
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                  onClick={requestNotificationPermissionHandler}
                  disabled={isNotificationLoading}
                >
                  {isNotificationLoading ? "처리 중..." : "🔔 알림 권한 요청"}
                </button>
              ) : (
                <>
                  <button
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                    onClick={sendTestNotification}
                    disabled={isNotificationLoading}
                  >
                    {isNotificationLoading ? "발송 중..." : "📱 테스트 알림 발송"}
                  </button>
                  <button
                    className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                    onClick={sendBroadcastNotification}
                    disabled={isNotificationLoading}
                  >
                    {isNotificationLoading ? "발송 중..." : "📢 전체 알림 발송"}
                  </button>
                </>
              )}
            </div>
          </div>

          <button className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors" onClick={refreshPage}>
            🔄 페이지 새로고침
          </button>

          <button
            className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
            onClick={handlePermissionStatusCheckWithDebug}
          >
            🔍 권한 상태 확인
          </button>

          <button
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={handleAPIStatusCheckWithDebug}
          >
            🔧 API 상태 확인
          </button>

          <button
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            onClick={handleAndroidDebugInfoWithDebug}
          >
            🤖 Android 디버깅 정보
          </button>
        </div>

        {/* 모바일 디버깅 메시지 */}
        <div className="w-full mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-yellow-700 dark:text-yellow-300">📱 모바일 디버깅 로그</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {debugMessages.length === 0 ? (
              <p className="text-xs text-gray-500">아직 디버그 메시지가 없습니다.</p>
            ) : (
              debugMessages.map((message, index) => (
                <p key={`debug-${index}-${Date.now()}`} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {message || ""}
                </p>
              ))
            )}
          </div>
          <button onClick={() => setDebugMessages([])} className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 hover:underline">
            로그 지우기
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
