// 서비스 워커 버전
const CACHE_NAME = 'twa-test-v1';

// 캐시할 파일 목록
const urlsToCache = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.svg',
    '/icons/icon-512x512.svg'
];

/**
 * 서비스 워커 설치 이벤트
 * 역할: PWA 앱의 핵심 파일들을 브라우저 캐시에 저장
 * 시점: 서비스 워커가 처음 등록되거나 업데이트될 때
 * 목적: 오프라인에서도 앱이 동작할 수 있도록 필수 리소스 캐싱
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                // 각 URL을 개별적으로 캐시하여 에러 방지
                return Promise.allSettled(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err);
                            return null;
                        });
                    })
                );
            })
            .then(() => {
                console.log('Cache installation completed');
                // 즉시 활성화
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('Cache installation failed:', err);
            })
    );
});

/**
 * 네트워크 요청 인터셉트 이벤트
 * 역할: 모든 네트워크 요청을 가로채서 캐시 우선 전략 적용
 * 동작: 캐시에 있으면 캐시 반환, 없으면 네트워크에서 가져와서 캐시 저장
 * 목적: 빠른 로딩 속도와 오프라인 지원
 */
self.addEventListener('fetch', (event) => {
    // POST 요청이나 Firebase API 요청은 캐시하지 않음
    if (event.request.method !== 'GET' ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('firebase') ||
        event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에서 찾으면 캐시된 응답 반환
                if (response) {
                    return response;
                }

                // 캐시에 없으면 네트워크에서 가져옴
                return fetch(event.request)
                    .then((response) => {
                        // 응답이 유효하지 않으면 그냥 반환
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답을 복제해서 캐시에 저장
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
    );
});

/**
 * 서비스 워커 활성화 이벤트
 * 역할: 이전 버전의 캐시 정리 및 새 서비스 워커 활성화
 * 시점: 새 서비스 워커가 설치 완료 후 활성화될 때
 * 목적: 오래된 캐시 제거로 저장 공간 절약 및 최신 상태 유지
 */
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        Promise.all([
            // 이전 캐시 정리
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheWhitelist.indexOf(cacheName) === -1) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // 클라이언트 제어 시작
            self.clients.claim()
        ])
    );
});

/**
 * 알림 클릭 이벤트
 * 역할: 사용자가 푸시 알림을 클릭했을 때의 동작 처리
 * 동작: 알림 닫기 → 앱 창 포커스 또는 새 창 열기
 * 목적: 알림을 통한 앱 재진입 및 사용자 경험 향상
 */
self.addEventListener('notificationclick', (event) => {
    console.log('알림 클릭됨:', event);

    const notification = event.notification;
    const action = event.action;

    notification.close();

    if (action === 'close') {
        // 닫기 액션 - 아무것도 하지 않음
        return;
    }

    // 앱 열기 (기본 액션 또는 '열기' 액션)
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // 이미 열린 창이 있는지 확인
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    console.log('기존 창에 포커스');
                    return client.focus();
                }
            }

            // 새 창 열기
            if (clients.openWindow) {
                console.log('새 창 열기');
                const urlToOpen = notification.data?.url || '/';
                return clients.openWindow(urlToOpen);
            }
        }).catch(err => {
            console.error('알림 클릭 처리 오류:', err);
        })
    );
});

/**
 * 알림 닫기 이벤트
 * 역할: 사용자가 알림을 닫았을 때의 동작 처리
 * 동작: 알림 닫기 로그 기록 (필요시 분석 데이터 전송)
 * 목적: 사용자 행동 분석 및 알림 효과 측정
 */
self.addEventListener('notificationclose', (event) => {
    console.log('알림 닫힘:', event);
    // 필요시 분석 데이터 전송
});

/**
 * 푸시 이벤트 처리 (FCM 푸시 알림 수신)
 * 역할: Firebase FCM 서버에서 전송된 푸시 메시지를 브라우저 알림으로 변환
 * 시점: 앱이 백그라운드/종료 상태일 때 푸시 메시지 수신
 * 동작: FCM 데이터 파싱 → 알림 옵션 구성 → 시스템 알림 표시
 * 목적: 실시간 푸시 알림을 통한 사용자 재참여 유도
 */
self.addEventListener('push', (event) => {
    console.log('푸시 이벤트 수신:', event);

    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('푸시 데이터:', payload);

            const notificationTitle = payload.notification?.title || payload.title || '새 알림';
            // 고유한 tag 생성 (타임스탬프 + 랜덤값)
            const uniqueTag = `push-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const notificationOptions = {
                body: payload.notification?.body || payload.body || '새로운 메시지가 도착했습니다.',
                icon: '/icons/icon-192x192.svg',
                tag: uniqueTag, // 고유한 tag로 변경
                data: {
                    ...payload.data,
                    ...payload,
                    timestamp: Date.now(),
                    notificationId: uniqueTag
                },
                requireInteraction: true,
                silent: false,
                vibrate: [200, 100, 200],
                actions: [
                    {
                        action: 'open',
                        title: '열기'
                    },
                    {
                        action: 'close',
                        title: '닫기'
                    }
                ]
            };

            // 알림 개수 관리 (최대 5개까지만 유지)
            event.waitUntil(
                self.registration.getNotifications()
                    .then(notifications => {
                        // 푸시 알림만 필터링
                        const pushNotifications = notifications.filter(n =>
                            n.tag && n.tag.startsWith('push-notification-')
                        );

                        // 5개 이상이면 가장 오래된 것부터 제거
                        if (pushNotifications.length >= 5) {
                            const sortedNotifications = pushNotifications.sort((a, b) =>
                                (a.data?.timestamp || 0) - (b.data?.timestamp || 0)
                            );

                            // 가장 오래된 알림들 제거
                            const toRemove = sortedNotifications.slice(0, pushNotifications.length - 4);
                            toRemove.forEach(notification => notification.close());
                        }

                        return self.registration.showNotification(notificationTitle, notificationOptions);
                    })
                    .catch(err => {
                        console.error('푸시 알림 관리 오류:', err);
                        return self.registration.showNotification(notificationTitle, notificationOptions);
                    })
            );
        } catch (error) {
            console.error('푸시 데이터 파싱 오류:', error);
            // 기본 알림 표시 (고유한 tag 사용)
            const uniqueTag = `default-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            event.waitUntil(
                self.registration.showNotification('새 알림', {
                    body: '새로운 메시지가 도착했습니다.',
                    icon: '/icons/icon-192x192.svg',
                    tag: uniqueTag,
                    data: {
                        timestamp: Date.now(),
                        notificationId: uniqueTag
                    }
                })
            );
        }
    }
});

console.log('서비스 워커 설정 완료'); 