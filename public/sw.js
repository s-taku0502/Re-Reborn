// Service Worker for Reborn
// Version: 1.0.0

const CACHE_NAME = 'michikusa_memory-v1';
const RUNTIME_CACHE = 'michikusa_memory-runtime-v1';

// インストール時にキャッシュするリソース
const PRECACHE_URLS = [
    '/',
    '/setup',
    '/oracle',
    '/record',
    '/album',
    '/mypage',
    '/manifest.json',
];

// インストールイベント
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

// アクティベーションイベント
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    self.clients.claim();
});

// キャッシュ可能なリクエストかチェック
function isCacheable(request) {
    // GET のみキャッシュ対象
    if (request.method !== 'GET') return false;
    
    // chrome-extension スキームはキャッシュ不可
    if (request.url.startsWith('chrome-extension://')) return false;
    
    // file スキームはキャッシュ不可
    if (request.url.startsWith('file://')) return false;
    
    return true;
}

// フェッチイベント（ネットワーク優先、フォールバックでキャッシュ）
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // キャッシュできないリクエストはスキップ
    if (!isCacheable(request)) {
        return;
    }

    // 画像は Cache First 戦略
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        return caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, response.clone());
                            return response;
                        });
                    }
                    return response;
                }).catch(() => {
                    return cachedResponse || new Response('Offline - Image not cached');
                });
            })
        );
        return;
    }

    // API リクエスト（Firestore など）は Network First
    if (request.url.includes('firestore.googleapis.com')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        return caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, response.clone());
                            return response;
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }

    // その他のリソースは Network First、フォールバックでキャッシュ
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Background Sync（オフライン時のデータ同期）
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-logs') {
        event.waitUntil(syncLogs());
    }
});

async function syncLogs() {
    // ここで localStorage から未同期のログを取得して Firestore にアップロード
    // 実装は lib/syncManager.ts で行う
    console.log('Background sync triggered for logs');
}

// Push 通知（将来の拡張用）
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || '新しい通知があります',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
    };
    event.waitUntil(self.registration.showNotification(data.title || 'Reborn', options));
});
