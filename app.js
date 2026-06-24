import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { APP_CONFIG } from "./config.js";

// 🌟【新機能】通知タップで起動した際、メッセージを画面にポップアップ表示する処理
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const msgTitle = urlParams.get('msg_title');
  const msgBody = urlParams.get('msg_body');

  if (msgTitle && msgBody) {
    // 画面がしっかり表示されてからポップアップを出す（0.5秒ずらす）
    setTimeout(() => {
      // 改行コード（\n）を、画面表示用の改行コード（\n）に綺麗に整える
      const cleanBody = decodeURIComponent(msgBody).replace(/\\n/g, '\n');
      
      // 美しいアラート画面（ポップアップ）を表示
      alert(`【${decodeURIComponent(msgTitle)}】\n\n${cleanBody}`);
      
      // 2回目開いた時にまた出ないように、URLからメッセージの文字をきれいに消しておく
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }, 500);
  }
})();

// ==========================================
// 1. FirebaseとGASの設定
// ==========================================
const app = initializeApp(APP_CONFIG.FIREBASE_CONFIG);
const messaging = getMessaging(app);
const GAS_WEB_APP_URL = APP_CONFIG.GAS_WEB_APP_URL;

// ==========================================
// 2. 表示の出し分けセンサー（起動時に自動チェック）
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // アプリ（ホーム画面）から開いているかチェック
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  
  if (isStandalone) {
    // 【アプリの場合】登録フォームを表示
    document.getElementById('app-content').classList.remove('hidden');
  } else {
    // 【ブラウザの場合】インストール案内を表示
    document.getElementById('install-guide').classList.remove('hidden');
    
    // スマホのOS（iPhoneかAndroidか）をチェックして案内文を切り替え
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      document.getElementById('ios-guide').classList.remove('hidden'); // iPhone用を出す
    } else if (/android/i.test(userAgent)) {
      document.getElementById('android-guide').classList.remove('hidden'); // Android用を出す
    } else {
      // PCなどの場合は両方出しておく
      document.getElementById('ios-guide').classList.remove('hidden');
      document.getElementById('android-guide').classList.remove('hidden');
    }
  }
});


// ==========================================
// 3. 登録ボタンが押された時の処理（変更なし）
// ==========================================
const form = document.getElementById('registration-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "登録中...";

    try {
      // プッシュ通知の許可とトークン取得
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("通知がブロックされています。スマホの設定で通知を許可してください。");
        submitBtn.disabled = false;
        submitBtn.innerText = "登録する";
        return;
      }

      const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        vapidKey: APP_CONFIG.VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!currentToken) {
        alert("プッシュ通知の宛先データが取得できませんでした。");
        submitBtn.disabled = false;
        submitBtn.innerText = "登録する";
        return;
      }

      // 入力データの収集
      const formData = {
        name: document.getElementById('customer-name').value,
        kana: document.getElementById('customer-kana').value,
        email: document.getElementById('customer-email').value,
        id: "",
        type: "プッシュ通知",
        token: currentToken
      };

      // GASへ送信
      const response = await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert("ご登録が完了しました！");
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
}

// 🌟【新規機能】画面下のタブを切り替える仕組み
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 1. 全てのボタンと画面から「active（選択中）」の状態を外す
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        // 2. クリックされたボタンと、それに対応する画面を「active」にして表示する
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
      });
    });
  }
});