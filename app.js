import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

// 1. Firebaseの設定（メモした firebaseConfig を貼り付けます）
const firebaseConfig = {
  apiKey: "AIzaSyCad1tGfQGD2Q2i_8LQkUsIH3GMKFA_7x0",
  authDomain: "webpush-tas.firebaseapp.com",
  projectId: "webpush-tas",
  storageBucket: "webpush-tas.firebasestorage.app",
  messagingSenderId: "281608025229",
  appId: "1:281608025229:web:0918eec5a3e9b9bb4a9ec4"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 2. ボタンを押したときの処理
document.getElementById('subscribe-btn').addEventListener('click', async () => {
  try {
    // ブラウザに通知の許可を求める
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('通知が許可されました。トークンを取得します...');
      
      // サービスワーカー（裏側で動く仕組み）を登録
      const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
      
      // 3. 宛先（デバイストークン）の発行（メモした 鍵ペア を貼り付けます）
      const currentToken = await getToken(messaging, {
        vapidKey: "BFL10FKLCIjNOVtmheG_RnGp_1RzAraQY7J6ZGf8BGgn4kYl9zwMqHhiSnPy1X8HXtmaKBhIaOlvauchg1gbc_k",
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        // 画面のテキストエリアにトークンを表示する
        document.getElementById('token-display').value = currentToken;
        alert("通知の登録が完了しました！");
      } else {
        alert("トークンが取得できませんでした。");
      }
    } else {
      alert("通知がブロックされています。ブラウザの設定を変更してください。");
    }
  } catch (error) {
    console.error("エラーが発生しました: ", error);
    alert("エラーが発生しました。詳細はコンソールを確認してください。");
  }
});