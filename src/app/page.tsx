"use client";

import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useNotification } from "@/hooks/useNotification";
import { useTime } from "@/hooks/useTime";
import InstallGuideModal from "@/components/InstallGuideModal";
import VersionInfo from "@/components/VersionInfo";
import NotificationStatus from "@/components/NotificationStatus";
import { handleCheckFeaturesClick, handlePermissionStatusCheck, handleAPIStatusCheck, handleAndroidDebugInfo } from "@/lib/utils/debug";

export default function Home() {
  const [deviceInfo, setDeviceInfo] = useState("디바이스 정보를 불러오는 중...");

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
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showCustomBanner, showIOSInstallGuide, setShowCustomBanner, setShowIOSInstallGuide]);

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
            onClick={handleCheckFeaturesClick}
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
            onClick={() => handlePermissionStatusCheck(fcmToken, notificationStatus, browserPermission)}
          >
            🔍 권한 상태 확인
          </button>

          <button
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={handleAPIStatusCheck}
          >
            🔧 API 상태 확인
          </button>

          <button
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            onClick={handleAndroidDebugInfo}
          >
            🤖 Android 디버깅 정보
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
