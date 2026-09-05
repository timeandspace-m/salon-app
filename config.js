// config.js
// ⚠️このファイルは絶対にAIにコピペしないでください

export const APP_CONFIG = {
  // 1. Firebaseの設定
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyCad1tGfQGD2Q2i_8LQkUsIH3GMKFA_7x0",
    authDomain: "webpush-tas.firebaseapp.com",
    projectId: "webpush-tas",
    storageBucket: "webpush-tas.firebasestorage.app",
    messagingSenderId: "281608025229",
    appId: "1:281608025229:web:0918eec5a3e9b9bb4a9ec4"
  },
  
  // 2. プッシュ通知用のVAPIDキー
  VAPID_KEY: "BBLac47vvpfbG-Laq1hGy5bXJ6jbEJJT2jY76LFXpY30s5u1t5qyeZYSvrDYvPEtpEKZlBX77iM_3DNHYdT3Y0A",

  // 3. GASのWebアプリURL
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwI46bsdyeyzRo6Y9iTkzmNee_68bovwH9j4uFVuoBJd791PFgGIEXtIQ44vSOqT2Y-/exec",

  // 4. PWA用 閲覧専用キー（追加）
  PWA_API_KEY: "read_PWA_TAS_mm_2026"

};