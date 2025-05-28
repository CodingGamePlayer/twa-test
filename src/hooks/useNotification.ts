import { useState, useEffect } from "react";
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase";
import { createForegroundNotification } from "@/lib/utils/notification";

export function useNotification() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("알림 권한 확인 중...");
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string>("확인 중...");

  useEffect(() => {
    // 브라우저 알림 권한 상태 업데이트
    let permissionCheckInterval: NodeJS.Timeout | null = null;

    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);

      // 권한 상태 변경 감지를 위한 주기적 확인
      permissionCheckInterval = setInterval(() => {
        const currentPermission = Notification.permission;
        setBrowserPermission(currentPermission);

        // 권한이 변경되었을 때 상태 업데이트
        if (currentPermission === "denied" && notificationStatus !== "알림 권한 거부됨") {
          setNotificationStatus("알림 권한 거부됨");
          setFcmToken(null);
          localStorage.removeItem("fcm-token");
        } else if (currentPermission === "granted" && !fcmToken && notificationStatus !== "FCM 토큰 생성 실패") {
          console.log("권한이 허용되었습니다. FCM 토큰을 다시 요청합니다.");
        }
      }, 2000);
    }

    // FCM 초기화 및 포그라운드 메시지 리스너 설정
    const initializeFCM = async () => {
      try {
        // 알림 권한 확인
        if ("Notification" in window) {
          const permission = Notification.permission;
          console.log("초기 알림 권한 상태:", permission);
          setBrowserPermission(permission);

          if (permission === "granted") {
            setNotificationStatus("FCM 토큰 확인 중...");
            const result = await requestNotificationPermission();
            if (result.success && result.token) {
              setFcmToken(result.token);
              setNotificationStatus("알림 권한 허용됨");
              console.log("FCM Token 저장됨:", result.token);
              localStorage.setItem("fcm-token", result.token);
            } else {
              console.warn("FCM 토큰 생성 실패:", result.error);
              setNotificationStatus("FCM 토큰 생성 실패");
              setBrowserPermission(Notification.permission);
            }
          } else if (permission === "denied") {
            setNotificationStatus("알림 권한 거부됨");
          } else {
            setNotificationStatus("알림 권한 요청 필요");
          }
        } else {
          setNotificationStatus("알림 지원되지 않음");
        }

        // 포그라운드 메시지 리스너
        onMessageListener()
          .then((payload: unknown) => {
            console.log("포그라운드 메시지 수신:", payload);
            if (payload && typeof payload === "object") {
              const messagePayload = payload as { notification?: { title?: string; body?: string } };
              createForegroundNotification({
                title: messagePayload.notification?.title || "새 알림",
                body: messagePayload.notification?.body,
              });
            }
          })
          .catch((err) => console.log("포그라운드 메시지 리스너 오류:", err));
      } catch (error) {
        console.error("FCM 초기화 오류:", error);
        setNotificationStatus("FCM 초기화 실패");
      }
    };

    initializeFCM();

    return () => {
      if (permissionCheckInterval) {
        clearInterval(permissionCheckInterval);
      }
    };
  }, [fcmToken, notificationStatus]);

  // 알림 권한 요청
  const requestNotificationPermissionHandler = async () => {
    setIsNotificationLoading(true);

    console.log("권한 요청 전 상태:", {
      notificationPermission: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unknown",
      currentStatus: notificationStatus,
      browserPermission: browserPermission,
    });

    try {
      const result = await requestNotificationPermission();
      console.log("권한 요청 결과:", result);

      if (result.success && result.token) {
        setFcmToken(result.token);
        setNotificationStatus("알림 권한 허용됨");
        setBrowserPermission(result.permission || "granted");
        localStorage.setItem("fcm-token", result.token);

        createForegroundNotification({
          title: "✅ 알림 권한 허용됨",
          body: `FCM 토큰이 생성되었습니다! 이제 푸시 알림을 받을 수 있습니다.`,
        });
      } else {
        if (result.permission === "denied") {
          setNotificationStatus("알림 권한 거부됨");
          setBrowserPermission("denied");
          createForegroundNotification({
            title: "❌ 알림 권한 거부됨",
            body: "브라우저 설정에서 알림 권한을 허용해주세요.",
          });
        } else if (result.permission === "default") {
          setNotificationStatus("알림 권한 요청 필요");
          setBrowserPermission("default");
          createForegroundNotification({
            title: "⚠️ 권한 요청 취소됨",
            body: "알림 권한 요청이 취소되었습니다.",
          });
        } else if (result.permission === "granted") {
          setNotificationStatus("FCM 토큰 생성 실패");
          setBrowserPermission("granted");
          createForegroundNotification({
            title: "⚠️ 토큰 생성 실패",
            body: `알림 권한은 허용되었지만 FCM 토큰 생성에 실패했습니다.`,
          });
        } else {
          setNotificationStatus("알림 권한 요청 실패");
          setBrowserPermission("unknown");
          createForegroundNotification({
            title: "❌ 권한 요청 실패",
            body: `알림 권한 요청 중 오류가 발생했습니다.`,
          });
        }
      }
    } catch (error) {
      console.error("알림 권한 요청 오류:", error);
      setNotificationStatus("알림 권한 요청 실패");
      createForegroundNotification({
        title: "❌ 권한 요청 오류",
        body: "알림 권한 요청 중 오류가 발생했습니다.",
      });
    } finally {
      setIsNotificationLoading(false);
    }
  };

  // 테스트 알림 발송
  const sendTestNotification = async () => {
    if (!fcmToken) {
      createForegroundNotification({
        title: "⚠️ 알림 설정 필요",
        body: "FCM 토큰이 없습니다. 먼저 알림 권한을 허용해주세요.",
      });
      return;
    }

    setIsNotificationLoading(true);
    console.log("테스트 알림 발송 시작...");

    try {
      const notificationData = {
        token: fcmToken,
        title: "🔔 TWA 테스트 알림",
        message: `테스트 알림입니다! 시간: ${new Date().toLocaleTimeString("ko-KR")}`,
        data: {
          testData: "test-value",
          timestamp: Date.now().toString(),
          url: window.location.href,
        },
      };

      console.log("발송할 알림 데이터:", notificationData);

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });

      const result = await response.json();
      console.log("알림 발송 응답:", result);

      if (result.success) {
        createForegroundNotification({
          title: "✅ 알림 발송 성공",
          body: "테스트 알림이 성공적으로 발송되었습니다! 백그라운드에서 알림을 확인해보세요.",
        });

        setTimeout(() => {
          createForegroundNotification({
            title: "🔔 TWA 테스트 알림",
            body: `포그라운드 테스트 알림입니다! 시간: ${new Date().toLocaleTimeString("ko-KR")}`,
          });
        }, 1000);
      } else {
        console.error("알림 발송 실패:", result);
        createForegroundNotification({
          title: "❌ 알림 발송 실패",
          body: `오류: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("알림 발송 오류:", error);
      createForegroundNotification({
        title: "❌ 알림 발송 오류",
        body: `오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsNotificationLoading(false);
    }
  };

  // 전체 알림 발송
  const sendBroadcastNotification = async () => {
    const savedTokens = localStorage.getItem("fcm-token");
    if (!savedTokens) {
      createForegroundNotification({
        title: "⚠️ 토큰 없음",
        body: "저장된 FCM 토큰이 없습니다.",
      });
      return;
    }

    setIsNotificationLoading(true);
    console.log("전체 알림 발송 시작...");

    try {
      const broadcastData = {
        tokens: [savedTokens],
        title: "📢 전체 알림",
        message: `모든 사용자에게 보내는 알림입니다! ${new Date().toLocaleTimeString("ko-KR")}`,
        data: {
          type: "broadcast",
          timestamp: Date.now().toString(),
          url: window.location.href,
        },
      };

      console.log("발송할 전체 알림 데이터:", broadcastData);

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(broadcastData),
      });

      const result = await response.json();
      console.log("전체 알림 발송 응답:", result);

      if (result.success) {
        createForegroundNotification({
          title: "✅ 전체 알림 발송 성공",
          body: `발송 완료! 성공: ${result.result?.successCount || 1}개, 실패: ${result.result?.failureCount || 0}개`,
        });

        setTimeout(() => {
          createForegroundNotification({
            title: "📢 전체 알림",
            body: `전체 사용자 알림입니다! 시간: ${new Date().toLocaleTimeString("ko-KR")}`,
          });
        }, 1000);
      } else {
        console.error("전체 알림 발송 실패:", result);
        createForegroundNotification({
          title: "❌ 전체 알림 발송 실패",
          body: `오류: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("전체 알림 발송 오류:", error);
      createForegroundNotification({
        title: "❌ 전체 알림 발송 오류",
        body: `오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsNotificationLoading(false);
    }
  };

  return {
    fcmToken,
    notificationStatus,
    isNotificationLoading,
    browserPermission,
    requestNotificationPermissionHandler,
    sendTestNotification,
    sendBroadcastNotification,
  };
}
