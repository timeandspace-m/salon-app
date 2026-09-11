importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 💡 【追加】古い受信機を強制的に破棄して、新しい仕組みへ一瞬で切り替える魔法のコード
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 1. Firebaseの設定（app.js と同じ firebaseConfig を貼り付けます）
const firebaseConfig = {
  apiKey: "AIzaSyCad1tGfQGD2Q2i_8LQkUsIH3GMKFA_7x0",
  authDomain: "webpush-tas.firebaseapp.com",
  projectId: "webpush-tas",
  storageBucket: "webpush-tas.firebasestorage.app",
  messagingSenderId: "281608025229",
  appId: "1:281608025229:web:0918eec5a3e9b9bb4a9ec4"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// バックグラウンドで通知を受け取ったときの処理
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] バックグラウンドで通知を受信しました', payload);
  
  // ★重要★ 
  // ここに書かれていた「return self.registration.showNotification(...)」の数行を削除しました。
  // これにより、Firebaseの自動通知機能だけが働くようになり、2重送信を100%防止します。
});

self.addEventListener('notificationclick', function(event) {
  // 1. 通知のクローズ
  event.notification.close();

  // 2. URLの抽出
  const notificationData = event.notification.data || {};
  // Firebaseのペイロード構造を網羅的に確認し、パラメータ付きURLを安全に抽出
  const targetUrl = notificationData.url || 
                    notificationData.link || 
                    (notificationData.FCM_MSG && notificationData.FCM_MSG.notification ? notificationData.FCM_MSG.notification.click_action : '/');

  // 3 & 4. 既存ウィンドウの検索・リロード、または新規ウィンドウの展開
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // 既存のウィンドウが存在する場合
        if (client.url && 'focus' in client) {
          return client.focus().then(function(focusedClient) {
            if (focusedClient && 'navigate' in focusedClient) {
              // 抽出したURLを用いて強制的に画面遷移（パラメータ再読み込み）
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      // 既存のウィンドウが存在しない（タスクキル状態）場合
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});