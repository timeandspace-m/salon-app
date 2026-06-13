importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

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
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // アイコンがあれば設定可能（今はそのままでOK）
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});