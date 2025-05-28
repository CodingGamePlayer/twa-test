interface NotificationStatusProps {
  notificationStatus: string;
  fcmToken: string | null;
  browserPermission: string;
}

export default function NotificationStatus({ notificationStatus, fcmToken, browserPermission }: NotificationStatusProps) {
  return (
    <div className="w-full p-4 mb-6 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
      <h2 className="text-lg font-semibold mb-2 text-orange-700 dark:text-orange-300">🔔 푸시 알림 상태</h2>
      <div className="space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          상태: <span className="font-medium">{notificationStatus}</span>
        </p>

        {/* 권한 거부됨 상태일 때 도움말 표시 */}
        {notificationStatus === "알림 권한 거부됨" && (
          <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">⚠️ 알림 권한이 거부되었습니다</p>
            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
              <p>
                <strong>Chrome에서 권한 재설정 방법:</strong>
              </p>
              <p>1. 주소창 왼쪽 🔒 아이콘 클릭</p>
              <p>2. &quot;알림&quot; 설정을 &quot;허용&quot;으로 변경</p>
              <p>3. 페이지 새로고침 후 다시 시도</p>
            </div>
          </div>
        )}

        {fcmToken && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="mb-1">FCM 토큰:</p>
            <p className="break-all bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">{fcmToken.substring(0, 50)}...</p>
          </div>
        )}

        {/* 현재 브라우저 알림 권한 상태 표시 */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>
            브라우저 알림 권한: <span className="font-mono">{browserPermission}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
