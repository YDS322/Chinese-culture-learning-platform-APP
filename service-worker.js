// 定义缓存名称和版本
const CACHE_NAME = 'culture-app-v1.0';
const CACHE_VERSION = 'v1.0';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`${CACHE_NAME} 缓存已打开`);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('所有资源已缓存');
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // 删除旧版本的缓存
          if (cache !== CACHE_NAME) {
            console.log(`删除旧缓存: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  // 立即接管所有客户端
  return self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  // 忽略非GET请求
  if (event.request.method !== 'GET') return;
  
  // 忽略chrome-extension请求
  if (event.request.url.includes('chrome-extension')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有匹配的资源，则返回
        if (response) {
          return response;
        }
        
        // 否则从网络获取
        return fetch(event.request)
          .then(response => {
            // 检查是否收到有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应以缓存
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // 当网络请求失败时，显示自定义离线页面
        return caches.match('/offline.html');
      })
  );
});