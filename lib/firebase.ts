import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化（すでに初期化されている場合は既存のインスタンスを使用）
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    db = getFirestore(app);
    auth = getAuth(app);

    // 匿名認証の自動サインイン
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            signInAnonymously(auth).catch((error) => {
                console.error('匿名認証エラー:', error);
            });
        }
    });
}

export { app, db, auth };

/**
 * Firebase匿名認証を確実に実行する
 */
export async function ensureAuthenticated(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const currentUser = auth?.currentUser;
    if (currentUser) return;

    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error('匿名認証失敗:', error);
        throw new Error('認証に失敗しました');
    }
}
