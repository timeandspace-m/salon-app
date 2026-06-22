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
  VAPID_KEY: "ここにVAPIDキー",

  // 3. GASのWebアプリURL
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbypTkyUv4n0RioQHB2aNO2CeUlAfuLE0eO2VAM6fS8uLHW_FhSIPD5PdppzAsN0qxu5/exec"
};