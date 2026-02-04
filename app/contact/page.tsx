'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './contact.module.css';

export default function ContactPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'お問い合わせの送信に失敗しました');
            }

            // 成功時
            router.push('/contact/success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>お問い合わせ</h1>
                <p className={styles.description}>
                    ご質問・ご意見・不具合報告など、お気軽にお問い合わせください。
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            お名前 <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="山田 太郎"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            メールアドレス <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="subject" className={styles.label}>
                            件名 <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className={styles.select}
                        >
                            <option value="">選択してください</option>
                            <option value="質問">質問</option>
                            <option value="不具合報告">不具合報告</option>
                            <option value="機能要望">機能要望</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="message" className={styles.label}>
                            お問い合わせ内容 <span className={styles.required}>*</span>
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            className={styles.textarea}
                            placeholder="お問い合わせ内容をご記入ください"
                            rows={8}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={styles.submitButton}
                    >
                        {isSubmitting ? '送信中...' : '送信する'}
                    </button>
                </form>

                <button onClick={() => router.back()} className={styles.backButton}>
                    戻る
                </button>
            </div>
        </div>
    );
}
