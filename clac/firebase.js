/* ════════════════════════════════════════
   firebase.js — Firebase Auth 연동
   ════════════════════════════════════════

   TODO: 아래 firebaseConfig 값을 실제
         Firebase 프로젝트 설정으로 교체하세요.
         Firebase Console → 프로젝트 설정 → 앱 등록 후 확인 가능
   ════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// //firebase_auth: 아래 값을 실제 프로젝트 설정으로 교체
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

/* ── 로그인 상태 변화 감지 → UI 업데이트 ── */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 로그인 성공
    document.getElementById('lov').style.display = 'none';
    document.getElementById('uid').textContent   = user.displayName || '게스트';
    document.getElementById('av').textContent    = (user.displayName || 'G')[0].toUpperCase();
    document.getElementById('av').style.background =
      user.isAnonymous ? 'var(--muted)' : '#4285F4';
  } else {
    // 로그아웃 상태
    document.getElementById('lov').style.display = 'flex';
    document.getElementById('uid').textContent   = '비로그인';
    document.getElementById('av').textContent    = '?';
    document.getElementById('av').style.background = 'var(--accent)';
  }
});

/* ── Google 로그인 ── */
export async function loginGoogle() {
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged가 자동으로 UI 업데이트
  } catch (e) {
    console.error('Google 로그인 실패:', e);
    alert('로그인에 실패했습니다: ' + e.message);
  }
}

/* ── 게스트(익명) 로그인 ── */
export async function loginGuest() {
  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.error('게스트 로그인 실패:', e);
    alert('게스트 로그인에 실패했습니다: ' + e.message);
  }
}

/* ── 로그아웃 ── */
export async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('로그아웃 실패:', e);
  }
}

/* ── 현재 유저 반환 ── */
export function getCurrentUser() {
  return auth.currentUser;
}
