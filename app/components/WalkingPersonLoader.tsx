'use client';

/**
 * 踊ってる人のアニメーション
 * お題生成中に表示するローディング画面用
 */
export function WalkingPersonLoader() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            width: '100%',
        }}>
            <img
                src="/loading_stickman.gif"
                alt="読み込み中"
                width={160}
                height={160}
                style={{
                    opacity: 0.9,
                }}
            />
        </div>
    );
}

export const theme_color = '#4CAF50';
export const status_bar_color = '#4CAF50';
