import { NextRequest, NextResponse } from "next/server";

// 간단한 메모리 저장소 (실제 환경에서는 데이터베이스 사용)
// eslint-disable-next-line prefer-const
let fcmTokens: Set<string> = new Set();

export async function GET() {
  try {
    const tokens = Array.from(fcmTokens);
    return NextResponse.json({
      success: true,
      count: tokens.length,
      tokens: tokens,
      message: `현재 등록된 토큰 ${tokens.length}개`,
    });
  } catch (error) {
    console.error("토큰 조회 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "토큰 조회 실패",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 토큰",
          details: "token 필드가 필요합니다",
        },
        { status: 400 }
      );
    }

    // 토큰 추가
    fcmTokens.add(token);

    console.log(`FCM 토큰 등록됨: ${token.substring(0, 20)}...`);
    console.log(`총 등록된 토큰 수: ${fcmTokens.size}`);

    return NextResponse.json({
      success: true,
      message: "토큰이 성공적으로 등록되었습니다",
      totalTokens: fcmTokens.size,
    });
  } catch (error) {
    console.error("토큰 등록 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "토큰 등록 실패",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "유효하지 않은 토큰",
          details: "token 필드가 필요합니다",
        },
        { status: 400 }
      );
    }

    // 토큰 삭제
    const deleted = fcmTokens.delete(token);

    if (deleted) {
      console.log(`FCM 토큰 삭제됨: ${token.substring(0, 20)}...`);
      console.log(`남은 토큰 수: ${fcmTokens.size}`);
    }

    return NextResponse.json({
      success: true,
      message: deleted ? "토큰이 성공적으로 삭제되었습니다" : "토큰을 찾을 수 없습니다",
      deleted: deleted,
      totalTokens: fcmTokens.size,
    });
  } catch (error) {
    console.error("토큰 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "토큰 삭제 실패",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// 모든 토큰 삭제 (개발용)
export async function PATCH() {
  try {
    const previousCount = fcmTokens.size;
    fcmTokens.clear();

    console.log(`모든 FCM 토큰 삭제됨 (${previousCount}개)`);

    return NextResponse.json({
      success: true,
      message: `모든 토큰이 삭제되었습니다 (${previousCount}개)`,
      deletedCount: previousCount,
      totalTokens: 0,
    });
  } catch (error) {
    console.error("전체 토큰 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "전체 토큰 삭제 실패",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
