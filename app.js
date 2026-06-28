import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { APP_CONFIG } from "./config.js";

// 🌟通知タップで起動した際、メッセージを画面にポップアップ表示する処理
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const msgTitle = urlParams.get('msg_title');
  const msgBody = urlParams.get('msg_body');

  if (msgTitle && msgBody) {
    setTimeout(() => {
      const cleanBody = decodeURIComponent(msgBody).replace(/\\n/g, '\n');
      
      // 🚨 以前の alert() を削除し、カスタムモーダルを表示する処理に変更
      document.getElementById('modal-title').innerText = decodeURIComponent(msgTitle);
      document.getElementById('modal-body').innerText = cleanBody;
      const modal = document.getElementById('custom-modal');
      modal.classList.remove('hidden');

      // 閉じるボタンの処理
      document.getElementById('modal-close').addEventListener('click', () => {
        modal.classList.add('hidden');
      });

      // URLからパラメータを消してスッキリさせる
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }, 500);
  }
})();

const app = initializeApp(APP_CONFIG.FIREBASE_CONFIG);
const messaging = getMessaging(app);
const GAS_WEB_APP_URL = APP_CONFIG.GAS_WEB_APP_URL;

document.addEventListener("DOMContentLoaded", () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  
  if (isStandalone) {
    document.getElementById('app-content').classList.remove('hidden');
  } else {
    document.getElementById('install-guide').classList.remove('hidden');
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      document.getElementById('ios-guide').classList.remove('hidden');
    } else if (/android/i.test(userAgent)) {
      document.getElementById('android-guide').classList.remove('hidden');
    } else {
      document.getElementById('ios-guide').classList.remove('hidden');
      document.getElementById('android-guide').classList.remove('hidden');
    }
  }
});

const form = document.getElementById('registration-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "登録中...";

    try {
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

      const formData = {
        name: document.getElementById('customer-name').value,
        kana: document.getElementById('customer-kana').value,
        email: document.getElementById('customer-email').value,
        id: "",
        type: "プッシュ通知",
        token: currentToken
      };

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

// 🌟画面下のタブを切り替える仕組み
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
      });
    });
  }
});

// 🌟アプリ起動時に次回の予約を自動取得する処理
async function loadNextReservation() {
  const reservationText = document.getElementById('next-reservation');
  if (!reservationText) return;
  
  try {
    const messaging = getMessaging();
    const registration = await navigator.serviceWorker.ready;
    
    const token = await getToken(messaging, { 
      vapidKey: APP_CONFIG.VAPID_KEY, 
      serviceWorkerRegistration: registration 
    });

    if (!token) {
      reservationText.textContent = "通知設定が未登録です";
      return;
    }

    const gasUrl = APP_CONFIG.GAS_WEB_APP_URL + "?token=" + encodeURIComponent(token);
    const response = await fetch(gasUrl);
    const result = await response.json();

    if (result.status === "success") {
      reservationText.textContent = result.nextDate;
    } else {
      reservationText.textContent = "確認できませんでした";
    }
  } catch (error) {
    console.error("予約取得エラー:", error);
    reservationText.textContent = "通信エラー";
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNextReservation);
} else {
  loadNextReservation();
}