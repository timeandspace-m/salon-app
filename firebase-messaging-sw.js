// =============================================================
// 通知タップ時の独自処理
// ※ Firebaseライブラリを読み込む前に登録する
// =============================================================
self.addEventListener('notificationclick', function(event) {

  // Firebase側の標準クリック処理をここでは実行させない
  event.stopImmediatePropagation();

  event.notification.close();

  const notificationData = event.notification.data || {};
  const fcmMsg = notificationData.FCM_MSG || {};

  // GASから送信したパラメータ付きURLを取得
  const targetUrl =
    (fcmMsg.fcmOptions && fcmMsg.fcmOptions.link) ||
    (fcmMsg.data && fcmMsg.data.url) ||
    notificationData.url ||
    notificationData.link ||
    (fcmMsg.notification && fcmMsg.notification.click_action) ||
    '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {

      // すでにPWAが開いている場合
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];

        if (client.url && 'navigate' in client) {

          // パラメータ付きURLへ実際に画面遷移させる
          return client.navigate(targetUrl).then(function(navigatedClient) {

            if (navigatedClient && 'focus' in navigatedClient) {
              return navigatedClient.focus();
            }

            if ('focus' in client) {
              return client.focus();
            }
          });
        }
      }

      // PWAが完全に閉じている場合
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});


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

