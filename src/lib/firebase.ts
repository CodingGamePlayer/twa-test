/**
 * Firebase Client SDK - 클라이언트 사이드 알림 수신 준비 파일
 *
 * 🎯 주요 용도:
 * - 브라우저에서 FCM 토큰 생성 및 관리
 * - 사용자에게 알림 권한 요청
 * - 포그라운드 메시지 수신 (앱이 열려있을 때)
 * - 서비스 워커와 연동하여 알림 시스템 구축
 *
 * 📱 실행 환경: 사용자의 브라우저 (클라이언트 사이드)
 * 🔑 권한 수준: 일반 사용자 권한 (공개 키 사용)
 * 📥 주요 기능: 알림 수신 준비 담당 (발송 기능 없음)
 *
 * 🔄 사용 흐름:
 * 1. 사용자에게 알림 권한 요청
 * 2. FCM 토큰 생성 (알림 받을 주소 생성)
 * 3. 토큰을 서버로 전송하여 저장
 * 4. 포그라운드 메시지 리스너 설정
 *
 * ⚠️ 주의사항:
 * - 브라우저 환경에서만 실행 (서버에서 실행 불가)
 * - 공개 환경 변수 사용 (NEXT_PUBLIC_* 접두사)
 * - HTTPS 환경 또는 localhost에서만 동작
 */

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 설정 디버깅
console.log("Firebase 설정 상태:", {
  apiKey: firebaseConfig.apiKey ? "설정됨" : "누락",
  authDomain: firebaseConfig.authDomain ? "설정됨" : "누락",
  projectId: firebaseConfig.projectId ? "설정됨" : "누락",
  storageBucket: firebaseConfig.storageBucket ? "설정됨" : "누락",
  messagingSenderId: firebaseConfig.messagingSenderId ? "설정됨" : "누락",
  appId: firebaseConfig.appId ? "설정됨" : "누락",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? "설정됨" : "누락",
});

// 필수 환경 변수 확인
const missingEnvVars = [];
if (!firebaseConfig.apiKey) missingEnvVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain) missingEnvVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId) missingEnvVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!firebaseConfig.messagingSenderId) missingEnvVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!firebaseConfig.appId) missingEnvVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");
if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) missingEnvVars.push("NEXT_PUBLIC_FIREBASE_VAPID_KEY");

if (missingEnvVars.length > 0) {
  console.error("누락된 Firebase 환경 변수:", missingEnvVars);
}

const app = initializeApp(firebaseConfig);

let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

/**
 * 사용자에게 알림 권한을 요청하고 FCM 토큰을 생성
 *
 * 🔄 처리 과정:
 * 1. 브라우저에 알림 권한 요청 팝업 표시
 * 2. 권한 허용 시 FCM 토큰 생성
 * 3. 생성된 토큰으로 서버에서 알림 발송 가능
 *
 * @returns Promise<{
 *   success: boolean,     // 토큰 생성 성공 여부
 *   permission: string,   // 권한 상태 ('granted', 'denied', 'default')
 *   token: string | null, // 생성된 FCM 토큰 (알림 받을 주소)
 *   error: string | null  // 오류 메시지
 * }>
 *
 * 💡 사용 시점: 앱 초기화 시 또는 사용자가 알림 설정 버튼 클릭 시
 */
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.error("Firebase messaging이 초기화되지 않았습니다.");
    return { success: false, error: "Firebase messaging not initialized", permission: null, token: null };
  }

  // VAPID 키 확인
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.error("VAPID 키가 설정되지 않았습니다.");
    return { success: false, error: "VAPID key not configured", permission: null, token: null };
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("알림 권한 요청 결과:", permission);

    if (permission === "granted") {
      // 기존 서비스 워커 사용 (layout.tsx에서 이미 등록됨)
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log("기존 서비스 워커 사용:", registration.scope);
        } else {
          console.warn("서비스 워커가 등록되지 않았습니다.");
        }
      } catch (swError) {
        console.warn("서비스 워커 확인 실패:", swError);
      }

      try {
        // 기존 서비스 워커 사용
        const registration = await navigator.serviceWorker.getRegistration();

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration || undefined,
        });

        if (token) {
          console.log("FCM Token 생성 성공:", token);
          return { success: true, permission, token, error: null };
        } else {
          console.error("FCM 토큰 생성 실패: 토큰이 null입니다.");
          return { success: false, permission, token: null, error: "FCM token generation failed" };
        }
      } catch (tokenError) {
        console.error("FCM 토큰 생성 중 오류:", tokenError);
        return { success: false, permission, token: null, error: `FCM token error: ${tokenError}` };
      }
    } else if (permission === "denied") {
      console.log("사용자가 알림 권한을 거부했습니다.");
      return { success: false, permission, token: null, error: "Permission denied by user" };
    } else {
      console.log("알림 권한이 기본값(default)입니다.");
      return { success: false, permission, token: null, error: "Permission is default" };
    }
  } catch (error) {
    console.error("알림 권한 요청 중 오류:", error);
    return { success: false, permission: null, token: null, error: `Permission request failed: ${error}` };
  }
};

/**
 * 포그라운드 메시지 리스너 설정
 *
 * 📱 동작 조건: 앱이 브라우저에서 열려있고 포커스된 상태
 * 🔄 처리 과정:
 * 1. FCM 서버에서 메시지 수신
 * 2. onMessage 콜백 함수 실행
 * 3. 받은 메시지를 Promise로 반환
 *
 * @returns Promise - 수신된 메시지 페이로드
 *
 * 💡 사용 예시:
 * onMessageListener().then(payload => {
 *   console.log('포그라운드 메시지:', payload);
 *   // 사용자에게 알림 표시 로직
 * });
 *
 * ⚠️ 주의사항: 백그라운드 메시지는 서비스 워커에서 처리됨
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log("포그라운드 메시지 수신:", payload);
      resolve(payload);
    });
  });

export { messaging };
