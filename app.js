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
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwf1FZoh9RZrbJ6hKI6RIfIPHeUDIunY0fZGbWnru6Bch-0K1r_eX57nZwrCWUoqFRZ/exec"; 

// フォームの「登録する」ボタンが押されたときの動き（プッシュ通知専用）
document.getElementById('registration-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // 画面の勝手なリロードを防ぐ
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = "登録中...";

  try {
    // 【1】まずプッシュ通知の許可を取り、スマホの住所（トークン）を取得する
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert("通知がブロックされています。ブラウザの設定で通知を許可してください。");
      submitBtn.disabled = false;
      submitBtn.innerText = "登録する";
      return;
    }

    const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    const currentToken = await getToken(messaging, {
      vapidKey: "BG3cg9dJimlrq6ij_l5uBqcvu4ky2nEaj4oL7uEJCeI58n2jeSIYi3uDEJEVk54AyWfk1_v5mewx56nMBxgHWpQ", // ※ご自身のVAPIDキーのままでOKです
      serviceWorkerRegistration: registration
    });

    if (!currentToken) {
      alert("プッシュ通知の宛先データが取得できませんでした。");
      submitBtn.disabled = false;
      submitBtn.innerText = "登録する";
      return;
    }

    // 【2】画面に入力された文字をかき集める
    const formData = {
      name: document.getElementById('customer-name').value,
      kana: document.getElementById('customer-kana').value,
      email: document.getElementById('customer-email').value,
      id: "",
      type: "プッシュ通知", // 完全に「プッシュ通知」で固定
      token: currentToken   // 取得したばかりのトークンを直接セット
    };

    // 【3】GAS（スプレッドシート）へデータを送信します
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === "h/exec") {
      console.log("送信データ:", formData);
      alert("【テスト動作】データを集めました！GASのURLを設定するとスプレッドシートに保存されます。\nお名前: " + formData.name);
      submitBtn.disabled = false;
      submitBtn.innerText = "登録する";
      return;
    }

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
    alert("登録送信中にエラーが発生しました。\n詳細: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "登録する";
  }
});