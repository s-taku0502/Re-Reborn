import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { hashPassword } from './password';
import { getAdminApp } from './firebase-admin';

/**
 * Firebase Admin SDK は firebase-admin.ts から取得
 */

/**
 * Firestore インスタンスを取得
 */
export function getAdminDb() {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * 管理者ドキュメントの型定義
 */
export interface AdminDocument {
  adminId: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin' | 'moderator';
  passwordHash: string;
  permissions?: string[];
  createdAt: Timestamp;
  lastLoginAt?: Timestamp | null;
  isActive: boolean;
  createdBy?: string;
  loginAttempts?: {
    count: number;
    lockedUntil: Timestamp | null;
  };
}

/**
 * 初期 superadmin が存在するかどうか確認
 * @returns true: 存在する、false: 存在しない
 */
export async function hasSuperAdmin(): Promise<boolean> {
  const db = getAdminDb();
  const snapshot = await db
    .collection('admins')
    .where('role', '==', 'superadmin')
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * メールアドレスで管理者を検索
 * @param email - メールアドレス
 * @returns 管理者ドキュメント、またはない場合は null
 */
export async function findAdminByEmail(email: string): Promise<AdminDocument | null> {
  const db = getAdminDb();
  const snapshot = await db
    .collection('admins')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    ...doc.data(),
    adminId: doc.id,
  } as AdminDocument;
}

/**
 * 管理者 ID で管理者を検索
 * @param adminId - 管理者 ID
 * @returns 管理者ドキュメント、またはない場合は null
 */
export async function findAdminById(adminId: string): Promise<AdminDocument | null> {
  const db = getAdminDb();
  const doc = await db.collection('admins').doc(adminId).get();

  if (!doc.exists) return null;

  return {
    ...doc.data(),
    adminId: doc.id,
  } as AdminDocument;
}

/**
 * 新規管理者を作成
 * @param adminId - 管理者 ID（自動生成の場合は省略）
 * @param email - メールアドレス
 * @param displayName - 表示名
 * @param password - 7桁のパスワード
 * @param role - ロール
 * @param createdBy - 作成者の管理者 ID
 * @returns 作成した管理者の ID
 */
export async function createAdmin(
  email: string,
  displayName: string,
  password: string,
  role: 'superadmin' | 'admin' | 'moderator',
  createdBy?: string,
  adminId?: string
): Promise<string> {
  const db = getAdminDb();

  // メールの重複チェック
  const existing = await findAdminByEmail(email);
  if (existing) {
    throw new Error('Email already exists');
  }

  // パスワードをハッシュ化
  const passwordHash = await hashPassword(password);

  // ドキュメント ID を自動生成または指定された ID を使用
  const docId = adminId || `admin_${Date.now()}`;

  const adminData: Omit<AdminDocument, 'adminId'> = {
    email,
    displayName,
    role,
    passwordHash,
    isActive: true,
    createdAt: Timestamp.now(),
    lastLoginAt: null,
    ...(createdBy && { createdBy }),
    loginAttempts: {
      count: 0,
      lockedUntil: null,
    },
  };

  await db.collection('admins').doc(docId).set(adminData);

  return docId;
}

/**
 * 管理者のログイン失敗をカウント
 * @param adminId - 管理者 ID
 * @returns ロックされているかどうか
 */
export async function recordLoginFailure(adminId: string): Promise<boolean> {
  const db = getAdminDb();
  const admin = await findAdminById(adminId);

  if (!admin) {
    throw new Error('Admin not found');
  }

  const attempts = admin.loginAttempts || { count: 0, lockedUntil: null };
  const now = Date.now();

  // ロック中か確認
  if (attempts.lockedUntil && attempts.lockedUntil.toMillis() > now) {
    return true; // ロック中
  }

  // ロックが解除されている場合、カウントをリセット
  let newCount = attempts.lockedUntil && attempts.lockedUntil.toMillis() <= now ? 1 : attempts.count + 1;
  let lockedUntil = null;

  // 5回失敗でロック（15分間）
  if (newCount >= 5) {
    lockedUntil = Timestamp.fromMillis(now + 15 * 60 * 1000);
  }

  await db.collection('admins').doc(adminId).update({
    'loginAttempts.count': newCount,
    'loginAttempts.lockedUntil': lockedUntil,
  });

  return newCount >= 5; // ロック状態を返す
}

/**
 * ログイン成功時にログイン情報をリセット・更新
 * @param adminId - 管理者 ID
 */
export async function recordLoginSuccess(adminId: string): Promise<void> {
  const db = getAdminDb();

  await db.collection('admins').doc(adminId).update({
    lastLoginAt: Timestamp.now(),
    'loginAttempts.count': 0,
    'loginAttempts.lockedUntil': null,
  });
}

/**
 * 管理者を更新
 * @param adminId - 管理者 ID
 * @param data - 更新データ
 */
export async function updateAdmin(
  adminId: string,
  data: Partial<Omit<AdminDocument, 'adminId' | 'createdAt'>>
): Promise<void> {
  const db = getAdminDb();

  // createdAt は更新しない
  const { createdAt, ...updateData } = data as any;

  await db.collection('admins').doc(adminId).update(updateData);
}

/**
 * 管理者を削除
 * @param adminId - 管理者 ID
 */
export async function deleteAdmin(adminId: string): Promise<void> {
  const db = getAdminDb();

  // superadmin は削除不可（最後の superadmin を保護）
  const admin = await findAdminById(adminId);
  if (admin && admin.role === 'superadmin') {
    const superadmins = await db
      .collection('admins')
      .where('role', '==', 'superadmin')
      .get();

    if (superadmins.size <= 1) {
      throw new Error('Cannot delete the last superadmin');
    }
  }

  await db.collection('admins').doc(adminId).delete();
}

/**
 * すべての管理者を取得
 * @returns 管理者ドキュメントの配列
 */
export async function getAllAdmins(): Promise<AdminDocument[]> {
  const db = getAdminDb();
  const snapshot = await db.collection('admins').orderBy('createdAt', 'desc').get();

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    adminId: doc.id,
  })) as AdminDocument[];
}

/**
 * 監査ログを記録
 * @param adminId - 実行した管理者の ID
 * @param action - アクション
 * @param targetType - 対象タイプ
 * @param targetId - 対象 ID
 * @param changes - 変更内容
 * @param ipAddress - IP アドレス
 * @param userAgent - User Agent
 */
export async function recordAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  changes: { before?: any; after?: any },
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const db = getAdminDb();

  await db.collection('audit-logs').add({
    adminId,
    action,
    targetType,
    targetId,
    changes,
    ipAddress,
    userAgent,
    createdAt: Timestamp.now(),
  });
}
