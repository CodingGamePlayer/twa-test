import { useState, useEffect } from "react";

export function useTime() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  // 빌드 시간과 버전 정보 (환경 변수에서 가져오기)
  const buildTime = process.env.BUILD_TIME || "2024-01-01T00:00:00.000Z";
  const buildVersion = process.env.BUILD_VERSION || "v1.0.0";

  useEffect(() => {
    // 클라이언트 사이드 렌더링 확인
    setIsClient(true);

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

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatBuildTime = () => {
    return new Date(buildTime).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Seoul",
    });
  };

  const getRefreshTime = () => {
    return isClient
      ? new Date().toLocaleString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "로딩 중...";
  };

  return {
    currentTime,
    isClient,
    buildTime,
    buildVersion,
    formatBuildTime,
    getRefreshTime,
  };
}
