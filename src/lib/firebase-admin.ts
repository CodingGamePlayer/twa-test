/**
 * Firebase Admin SDK - 서버 사이드 알림 발송 전용 파일
 *
 * 🎯 주요 용도:
 * - 서버에서 클라이언트로 푸시 알림 발송
 * - Firebase 프로젝트의 관리자 권한으로 작업
 * - 단일/다중 사용자에게 동시 알림 발송
 *
 * 🖥️ 실행 환경: Next.js API 라우트 (서버 사이드)
 * 🔑 권한 수준: Firebase 관리자 권한 (비공개 키 사용)
 * 📤 주요 기능: 알림 발송만 담당 (수신 기능 없음)
 *
 * 🔄 사용 흐름:
 * 1. API 라우트에서 이 파일의 함수 호출
 * 2. Firebase Admin SDK로 FCM 서버에 알림 발송 요청
 * 3. FCM 서버가 사용자 디바이스로 알림 전달
 *
 * ⚠️ 주의사항:
 * - 서버 환경에서만 실행 (브라우저에서 실행 불가)
 * - 비공개 환경 변수 필요 (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// 환경 변수 검증
const requiredEnvVars = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// 환경 변수가 모두 설정되어 있는지 확인
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(`Firebase Admin SDK 환경 변수가 설정되지 않음: ${missingVars.join(", ")}`);
}

let app: ReturnType<typeof initializeApp> | null = null;
let adminMessaging: ReturnType<typeof getMessaging> | null = null;

// 모든 환경 변수가 설정된 경우에만 초기화
if (requiredEnvVars.projectId && requiredEnvVars.clientEmail && requiredEnvVars.privateKey) {
  try {
    const firebaseAdminConfig = {
      credential: cert({
        projectId: requiredEnvVars.projectId,
        clientEmail: requiredEnvVars.clientEmail,
        privateKey: requiredEnvVars.privateKey.replace(/\\n/g, "\n"),
      }),
    };

    // Firebase Admin 앱이 이미 초기화되었는지 확인
    app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
    adminMessaging = getMessaging(app);
    console.log("Firebase Admin SDK 초기화 성공");
  } catch (error) {
    console.error("Firebase Admin SDK 초기화 실패:", error);
  }
}

export { adminMessaging };

/**
 * 단일 사용자에게 푸시 알림 발송
 *
 * @param token - 대상 사용자의 FCM 토큰 (firebase.ts에서 생성된 토큰)
 * @param title - 알림 제목
 * @param body - 알림 내용
 * @param data - 추가 데이터 (선택사항)
 * @returns 발송 결과 객체 { success: boolean, messageId?: string, error?: any }
 *
 * 💡 사용 예시: 특정 사용자에게 개인 알림 발송
 */
export const sendNotificationToToken = async (token: string, title: string, body: string, data?: Record<string, string>) => {
  if (!adminMessaging) {
    console.error("Firebase Admin SDK가 초기화되지 않았습니다.");
    return { success: false, error: "Firebase Admin SDK not initialized" };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
      webpush: {
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        },
      },
    };

    const response = await adminMessaging.send(message);
    console.log("알림 발송 성공:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("알림 발송 실패:", error);
    return { success: false, error: error };
  }
};

/**
 * 여러 사용자에게 동시 푸시 알림 발송 (브로드캐스트)
 *
 * @param tokens - 대상 사용자들의 FCM 토큰 배열
 * @param title - 알림 제목
 * @param body - 알림 내용
 * @param data - 추가 데이터 (선택사항)
 * @returns 발송 결과 객체 { success: boolean, successCount: number, failureCount: number, responses: any[] }
 *
 * 💡 사용 예시: 전체 사용자에게 공지사항 발송, 그룹 알림 등
 */
export const sendNotificationToMultipleTokens = async (tokens: string[], title: string, body: string, data?: Record<string, string>) => {
  if (!adminMessaging) {
    console.error("Firebase Admin SDK가 초기화되지 않았습니다.");
    return { success: false, error: "Firebase Admin SDK not initialized" };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
      webpush: {
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        },
      },
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    console.log("다중 알림 발송 결과:", response);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error("다중 알림 발송 실패:", error);
    return { success: false, error: error };
  }
};
