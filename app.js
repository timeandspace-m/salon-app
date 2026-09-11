import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { APP_CONFIG } from "./config.js";

// 入力値から空白を削除し、半角カタカナを全角に変換する正規化関数
const sanitizeInput = (text) => {
  if (!text) return "";
  return text
    .replace(/[\s\u3000]+/g, "")
    .normalize('NFKC');
};

(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const msgTitle = urlParams.get('msg_title');
  const msgBody = urlParams.get('msg_body');
  
  const calStart = urlParams.get('cal_start');
  const calEnd = urlParams.get('cal_end');

  if (msgTitle && msgBody) {
    setTimeout(() => {
      const cleanBody = decodeURIComponent(msgBody).replace(/\\n/g, '\n');
      document.getElementById('modal-title').innerText = decodeURIComponent(msgTitle);
      document.getElementById('modal-body').innerText = cleanBody;
      const modal = document.getElementById('custom-modal');
      const closeBtn = document.getElementById('modal-close');

      const existingCalBtn = document.getElementById('modal-cal-btn');
      if (existingCalBtn) {
        existingCalBtn.remove();
      }

      if (calStart && calEnd) {
        const calBtn = document.createElement('button');
        calBtn.id = 'modal-cal-btn';
        calBtn.innerText = '📅 カレンダーに登録する';
        calBtn.style.marginBottom = '10px';
        calBtn.style.background = 'linear-gradient(135deg, #f39c12, #d35400)';
        
        calBtn.addEventListener('click', () => {
          const calUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('tiMe and space')}&dates=${calStart}/${calEnd}`;
          window.open(calUrl, '_blank');
        });
        
        closeBtn.parentNode.insertBefore(calBtn, closeBtn);
      }

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

let pendingRegistrationData = null;

const form = document.getElementById('registration-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    const rawName = document.getElementById('customer-name').value;
    const rawKana = document.getElementById('customer-kana').value;
    
    const cleanName = sanitizeInput(rawName);
    const cleanKana = sanitizeInput(rawKana);
    
    const email = document.getElementById('customer-email').value.trim();
    const dob = document.getElementById('customer-dob').value;

    document.getElementById('conf-name').textContent = cleanName;
    document.getElementById('conf-kana').textContent = cleanKana;
    document.getElementById('conf-dob').textContent = dob;
    document.getElementById('conf-email').textContent = email;

    pendingRegistrationData = {
      name: cleanName,
      kana: cleanKana,
      email: email,
      birthday: dob
    };

    document.getElementById('confirm-modal').classList.remove('hidden');
  });

  document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    pendingRegistrationData = null;
  });

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
        headers: { 'Content-Type': 'text/plain' }, // ★追加：CORSエラー回避用ヘッダ
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(gasUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const result = await response.json();

    if (result.status === "success") {
      reservationText.textContent = result.nextDate;
    } else {
      reservationText.textContent = "確認できませんでした";
    }
  } catch (error) {
    console.error("予約取得エラー:", error);
    reservationText.textContent = error.name === 'AbortError' ? "通信タイムアウト" : "通信エラー";
    
    // エラー時にDOM操作で安全にリロードボタンを生成・追加
    const reloadBtn = document.createElement('div');
    reloadBtn.innerHTML = '<span>🔄 再読み込み</span>';
    reloadBtn.style.cssText = 'font-size: 13px; color: #3498db; text-decoration: underline; cursor: pointer; margin-top: 8px;';
    reloadBtn.addEventListener('click', () => window.location.reload());
    reservationText.appendChild(reloadBtn);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNextReservation);
} else {
  loadNextReservation();
}

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
        headers: { 'Content-Type': 'text/plain' }, // ★追加：CORSエラー回避用ヘッダ
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