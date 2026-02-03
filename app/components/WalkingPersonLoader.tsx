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
            <svg
                width="120"
                height="140"
                viewBox="0 0 120 140"
                style={{
                    opacity: 0.8,
                }}
            >
                {/* 頭 */}
                <circle
                    cx="60"
                    cy="20"
                    r="10"
                    fill="#333"
                    style={{
                        transformOrigin: '60px 20px',
                        animation: 'headBob 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                {/* 体 */}
                <line
                    x1="60"
                    y1="30"
                    x2="60"
                    y2="55"
                    stroke="#333"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '60px 35px',
                        animation: 'bodyWiggle 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                {/* 左腕 - 上げ下げ */}
                <line
                    x1="60"
                    y1="33"
                    x2="35"
                    y2="20"
                    stroke="#333"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '60px 33px',
                        animation: 'danceArmLeft 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                {/* 右腕 - 上げ下げ */}
                <line
                    x1="60"
                    y1="33"
                    x2="85"
                    y2="20"
                    stroke="#333"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '60px 33px',
                        animation: 'danceArmRight 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                {/* 左足 */}
                <line
                    x1="60"
                    y1="55"
                    x2="45"
                    y2="85"
                    stroke="#333"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '60px 55px',
                        animation: 'danceLegLeft 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                {/* 右足 */}
                <line
                    x1="60"
                    y1="55"
                    x2="75"
                    y2="85"
                    stroke="#333"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '60px 55px',
                        animation: 'danceLegRight 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                {/* 左足の足の裏 */}
                <circle cx="45" cy="88" r="2.5" fill="#333" />
                {/* 右足の足の裏 */}
                <circle cx="75" cy="88" r="2.5" fill="#333" />
                
                {/* 笑顔 */}
                <circle
                    cx="55"
                    cy="18"
                    r="1.5"
                    fill="#333"
                    style={{
                        transformOrigin: '55px 18px',
                        animation: 'headBob 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                <circle
                    cx="65"
                    cy="18"
                    r="1.5"
                    fill="#333"
                    style={{
                        transformOrigin: '65px 18px',
                        animation: 'headBob 1.2s ease-in-out infinite',
                        transformBox: 'fill-box',
                    }}
                />
                
                <style>{`
                    @keyframes headBob {
                        0%, 100% {
                            transform: translateY(0) rotate(0deg);
                        }
                        25% {
                            transform: translateY(-8px) rotate(-5deg);
                        }
                        50% {
                            transform: translateY(0) rotate(0deg);
                        }
                        75% {
                            transform: translateY(-8px) rotate(5deg);
                        }
                    }
                    
                    @keyframes bodyWiggle {
                        0%, 100% {
                            transform: skewX(0deg);
                        }
                        25% {
                            transform: skewX(-8deg);
                        }
                        50% {
                            transform: skewX(0deg);
                        }
                        75% {
                            transform: skewX(8deg);
                        }
                    }
                    
                    @keyframes danceArmLeft {
                        0%, 100% {
                            transform: rotate(-30deg);
                        }
                        25% {
                            transform: rotate(-80deg);
                        }
                        50% {
                            transform: rotate(-30deg);
                        }
                        75% {
                            transform: rotate(-10deg);
                        }
                    }
                    
                    @keyframes danceArmRight {
                        0%, 100% {
                            transform: rotate(30deg);
                        }
                        25% {
                            transform: rotate(10deg);
                        }
                        50% {
                            transform: rotate(30deg);
                        }
                        75% {
                            transform: rotate(80deg);
                        }
                    }
                    
                    @keyframes danceLegLeft {
                        0%, 100% {
                            transform: rotate(-15deg);
                        }
                        25% {
                            transform: rotate(-35deg);
                        }
                        50% {
                            transform: rotate(-15deg);
                        }
                        75% {
                            transform: rotate(10deg);
                        }
                    }
                    
                    @keyframes danceLegRight {
                        0%, 100% {
                            transform: rotate(15deg);
                        }
                        25% {
                            transform: rotate(-10deg);
                        }
                        50% {
                            transform: rotate(15deg);
                        }
                        75% {
                            transform: rotate(35deg);
                        }
                    }
                `}</style>
            </svg>
        </div>
    );
}
