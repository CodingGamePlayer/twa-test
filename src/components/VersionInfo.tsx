interface VersionInfoProps {
  buildVersion: string;
  currentTime: string;
  isClient: boolean;
  formatBuildTime: () => string;
  getRefreshTime: () => string;
}

export default function VersionInfo({ buildVersion, currentTime, isClient, formatBuildTime, getRefreshTime }: VersionInfoProps) {
  return (
    <div className="w-full p-3 mb-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
      <h3 className="text-sm font-medium mb-2 text-indigo-700 dark:text-indigo-300">버전 정보</h3>
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <div>빌드 시간: {formatBuildTime()}</div>
        <div>현재 시간: {isClient ? currentTime : "로딩 중..."}</div>
        <div className="text-indigo-600 dark:text-indigo-400">버전: {buildVersion}</div>
        <div className="text-xs text-gray-500 dark:text-gray-500">마지막 새로고침: {getRefreshTime()}</div>
      </div>
    </div>
  );
}
