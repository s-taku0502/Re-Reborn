'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './users.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

interface User {
  userId: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string | null;
  lastLoginAt: string | null;
  totalWalks: number;
  totalDistance: number;
  totalDuration: number;
  profileImageUrl: string | null;
  isActive: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export default function UsersPage() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // ユーザー一覧を取得
  useEffect(() => {
    if (authLoading || !admin) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = getTokenFromStorage();
        if (!token) {
          setError('認証トークンがありません');
          return;
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          stats: offset === 0 ? 'true' : 'false', // 初回のみ統計を取得
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/admin/users?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('ユーザー一覧の取得に失敗しました');
        }

        const data = await response.json();
        setUsers(data.users);
        setTotal(data.total);
        
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('[Users] Error fetching users:', err);
        setError('ユーザー一覧の取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [admin, authLoading, offset, searchQuery, limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0); // 検索時は最初のページに戻る
  };

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <ProtectedAdminRoute>
        <div className={styles.usersContainer}>
          <div className={styles.errorMessage}>{error}</div>
        </div>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className={styles.usersContainer}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>👥 ユーザー管理</h1>
          </div>
          <p className={styles.subtitle}>
            登録ユーザーの一覧と詳細情報を管理します（管理者・スーパー管理者のみ）
          </p>
        </div>

        {/* 統計カード */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>総ユーザー数</div>
              <div className={styles.statValue}>{stats.totalUsers.toLocaleString()}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>アクティブ</div>
              <div className={styles.statValue}>{stats.activeUsers.toLocaleString()}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>今日の新規</div>
              <div className={styles.statValue}>{stats.newUsersToday.toLocaleString()}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>今週の新規</div>
              <div className={styles.statValue}>{stats.newUsersThisWeek.toLocaleString()}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>今月の新規</div>
              <div className={styles.statValue}>{stats.newUsersThisMonth.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* 検索 */}
        <div className={styles.controls}>
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="メールアドレスで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchButton}>
              🔍 検索
            </button>
          </form>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* ユーザーテーブル */}
        <div className={styles.tableContainer}>
          {users.length === 0 ? (
            <div className={styles.emptyState}>
              <p>📭 ユーザーが見つかりません</p>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ユーザー情報</th>
                    <th>登録日</th>
                    <th>最終ログイン</th>
                    <th>散歩回数</th>
                    <th>総距離</th>
                    <th>ステータス</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{user.username}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.lastLoginAt)}</td>
                      <td>{user.totalWalks.toLocaleString()}回</td>
                      <td>{formatDistance(user.totalDistance)}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            user.isActive ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {user.isActive ? 'アクティブ' : '無効'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/users/${user.userId}`}>
                          <button className={styles.actionButton}>詳細</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ページネーション */}
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  {total}件中 {offset + 1}-{Math.min(offset + limit, total)}件を表示
                </div>
                <div className={styles.paginationButtons}>
                  <button
                    className={styles.paginationButton}
                    onClick={handlePrevPage}
                    disabled={offset === 0}
                  >
                    ← 前へ
                  </button>
                  <button
                    className={styles.paginationButton}
                    onClick={handleNextPage}
                    disabled={offset + limit >= total}
                  >
                    次へ →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
