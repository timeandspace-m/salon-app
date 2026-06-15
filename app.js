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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ★あとで作成するGASの「WebアプリURL」を入れる場所です（一旦空欄でOK）
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwP2Idp_pI3BEF7Z_ROWAuSFxUxLRNDefnQLj_kt26lLfCkrfHYfic3rKmMXxy7s3de/exec"; 

// 通知方法の選択が変わったときの動き
document.getElementById('notification-type').addEventListener('change', async (e) => {
  if (e.target.value === "プッシュ通知") {
    try {
      // プッシュ通知が選ばれたら、その場で通知権限を許可してもらう
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        
        // 2. 鍵ペア（あなたのご自身のものに書き換えてください）
        const currentToken = await getToken(messaging, {
          vapidKey: "あなたのVAPIDキー",
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          // 隠し枠にトークンを保存
          document.getElementById('token-storage').value = currentToken;
          console.log("トークン取得成功");
        }
      } else {
        alert("通知がブロックされています。ブラウザの設定で通知を許可してください。");
        e.target.value = "メール"; // ブロックされたらメールに戻す
      }
    } catch (error) {
      console.error("トークン取得エラー:", error);
      alert("プッシュ通知の準備に失敗しました。メール送信を選択してください。");
      e.target.value = "メール";
    }
  }
});

// フォームの「登録する」ボタンが押されたときの動き
document.getElementById('registration-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // 画面の勝手なリロードを防ぐ
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = "登録中...";

  // 画面に入力された文字をかき集める
  const formData = {
    name: document.getElementById('customer-name').value,
    kana: document.getElementById('customer-kana').value,
    email: document.getElementById('customer-email').value,
    id: document.getElementById('customer-id').value,
    type: document.getElementById('notification-type').value,
    token: document.getElementById('token-storage').value
  };

  // プッシュ通知希望なのにトークンが無い場合の防衛策
  if (formData.type === "プッシュ通知" && !formData.token) {
    alert("プッシュ通知の宛先データが正しく取得できていません。もう一度通知方法を選び直してください。");
    submitBtn.disabled = false;
    submitBtn.innerText = "登録する";
    return;
  }

  // ★ここでGAS（スプレッドシート）へデータを送信します（URLが空の間はテスト用の動きをします）
  if (!GAS_WEB_APP_URL) {
    console.log("送信データ（テスト出力）:", formData);
    alert("【テスト動作】データを集めました！GASのURLを設定するとスプレッドシートに保存されます。\nお名前: " + formData.name);
    submitBtn.disabled = false;
    submitBtn.innerText = "登録する";
    return;
  }

  try {
    // GASのWebアプリへデータをインターネット経由で送信
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert("ご登録が完了しました！案内リマインダーを楽しみにお待ちください。");
      document.getElementById('registration-form').reset();
    } else {
      throw new Error("サーバーエラー");
    }
  } catch (error) {
    console.error("送信エラー:", error);
    alert("登録送信中にエラーが発生しました。通信環境の良い場所で再度お試しください。");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "登録する";
  }
});