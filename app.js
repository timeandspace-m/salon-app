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
      document.getElementById('modal-title').innerText = decodeURIComponent(msgTitle);
      document.getElementById('modal-body').innerText = cleanBody;
      const modal = document.getElementById('custom-modal');
      modal.classList.remove('hidden');

      document.getElementById('modal-close').addEventListener('click', () => {
        modal.classList.add('hidden');
      });

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

// 🌟 登録データの一時保管用変数
let pendingRegistrationData = null;

const form = document.getElementById('registration-form');
if (form) {
  // 1. フォーム送信時：確認モーダルを表示する処理
  form.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    // 🌟 姓と名、セイとメイを取得し、間に空白を一切入れずに結合（絶対仕様）
    const lastName = document.getElementById('customer-last-name').value.trim();
    const firstName = document.getElementById('customer-first-name').value.trim();
    const lastKana = document.getElementById('customer-last-kana').value.trim();
    const firstKana = document.getElementById('customer-first-kana').value.trim();
    
    const combinedName = lastName + firstName;
    const combinedKana = lastKana + firstKana;
    const email = document.getElementById('customer-email').value.trim();
    const dob = document.getElementById('customer-dob').value;

    // 確認用モーダルにデータを流し込む
    document.getElementById('conf-name').textContent = combinedName;
    document.getElementById('conf-kana').textContent = combinedKana;
    document.getElementById('conf-dob').textContent = dob;
    document.getElementById('conf-email').textContent = email;

    // 後で送信できるように変数に保持
    pendingRegistrationData = {
      name: combinedName,
      kana: combinedKana,
      email: email,
      birthday: dob
    };

    // モーダルを表示
    document.getElementById('confirm-modal').classList.remove('hidden');
  });

  // 2. モーダル内の「修正する」ボタン処理
  document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    pendingRegistrationData = null;
  });

  // 3. モーダル内の「送信する」ボタン処理（本送信）
  document.getElementById('confirm-submit-btn').addEventListener('click', async () => {
    if (!pendingRegistrationData) return;

    const submitBtn = document.getElementById('confirm-submit-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    submitBtn.innerText = "通信中...";

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("通知がブロックされています。スマホの設定で通知を許可してください。");
        throw new Error("Permission Denied");
      }

      const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        vapidKey: APP_CONFIG.VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!currentToken) {
        alert("プッシュ通知の宛先データが取得できませんでした。");
        throw new Error("Token Error");
      }

      const formData = {
        action: "register", 
        api_key: APP_CONFIG.CUSTOMER_API_KEY, 
        name: pendingRegistrationData.name,
        kana: pendingRegistrationData.kana,
        email: pendingRegistrationData.email,
        birthday: pendingRegistrationData.birthday,
        id: "",
        type: "プッシュ通知",
        token: currentToken
      };

      const response = await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.status === "success") {
        alert("ご登録が完了しました！");
        document.getElementById('registration-form').reset();
        document.getElementById('confirm-modal').classList.add('hidden');
      } else {
        throw new Error(result.message || "サーバーエラー");
      }

    } catch (error) {
      console.error("送信エラー:", error);
      if (error.message !== "Permission Denied" && error.message !== "Token Error") {
        alert("登録送信中にエラーが発生しました。\n詳細: " + error.message);
      }
    } finally {
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      submitBtn.innerText = "送信する";
    }
  });
}

// 🌟画面下のタブを切り替える仕組み（既存のまま）
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

// 🌟アプリ起動時に次回の予約を自動取得する処理（既存のまま）
async function loadNextReservation() {
  const reservationText = document.getElementById('next-reservation');
  if (!reservationText) return;
  
  try {
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

// 🌟 チェックインボタンの処理（既存のまま）
const checkinBtn = document.getElementById('checkin-btn');
const checkinMsg = document.getElementById('checkin-msg');

if (checkinBtn) {
  checkinBtn.addEventListener('click', async () => {
    checkinBtn.disabled = true;
    checkinBtn.innerHTML = "⏳ チェックイン中...";
    checkinMsg.textContent = "";

    try {
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, { 
        vapidKey: APP_CONFIG.VAPID_KEY, 
        serviceWorkerRegistration: registration 
      });

      if (!currentToken) {
        throw new Error("通知設定が許可されていないため、チェックインできません。");
      }

      const formData = {
        action: "check_in",
        api_key: APP_CONFIG.CUSTOMER_API_KEY, 
        token: currentToken
      };

      const response = await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.status === "success") {
        checkinBtn.innerHTML = "✨ チェックイン完了 ✨";
        checkinBtn.style.background = "#1976D2"; 
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      checkinMsg.textContent = "失敗しました: " + error.message;
      checkinBtn.disabled = false;
      checkinBtn.innerHTML = "<span class='icon'>✅</span> お店にチェックイン";
    }
  });
}