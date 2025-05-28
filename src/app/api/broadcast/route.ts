import { NextRequest, NextResponse } from "next/server";
import { sendNotificationToMultipleTokens } from "@/lib/firebase-admin";

// 토큰 저장소에서 모든 토큰 가져오기 (실제로는 데이터베이스에서)
async function getAllTokens(): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/tokens`, {
      method: "GET",
    });
    const result = await response.json();
    return result.success ? result.tokens : [];
  } catch (error) {
    console.error("토큰 조회 실패:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, message, data } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 필드 누락",
          details: "title과 message가 필요합니다",
        },
        { status: 400 }
      );
    }

    // 모든 등록된 토큰 가져오기
    const allTokens = await getAllTokens();

    if (allTokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: "등록된 토큰이 없습니다",
        details: "알림을 받을 사용자가 없습니다",
      });
    }

    console.log(`전체 알림 발송 시작: ${allTokens.length}개 토큰`);

    // 모든 토큰에 알림 발송
    const result = await sendNotificationToMultipleTokens(allTokens, title, message, data);

    if (result.success) {
      console.log(`전체 알림 발송 완료: 성공 ${result.successCount}개, 실패 ${result.failureCount}개`);

      return NextResponse.json({
        success: true,
        message: "전체 알림이 성공적으로 발송되었습니다",
        result: {
          totalTokens: allTokens.length,
          successCount: result.successCount,
          failureCount: result.failureCount,
          responses: result.responses,
        },
      });
    } else {
      console.error("전체 알림 발송 실패:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: "전체 알림 발송 실패",
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("전체 알림 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "서버 오류",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allTokens = await getAllTokens();

    return NextResponse.json({
      success: true,
      message: "전체 알림 발송 API",
      description: "등록된 모든 FCM 토큰에 알림을 발송합니다",
      registeredTokens: allTokens.length,
      endpoints: {
        POST: "전체 알림 발송",
        body: {
          title: "알림 제목 (필수)",
          message: "알림 내용 (필수)",
          data: "추가 데이터 (선택사항)",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "API 정보 조회 실패",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
