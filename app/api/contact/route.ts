import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, subject, message } = body;

        // バリデーション
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: '必須項目が入力されていません' },
                { status: 400 }
            );
        }

        // メールアドレスの簡易バリデーション
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: '有効なメールアドレスを入力してください' },
                { status: 400 }
            );
        }

        // Firestoreに保存
        const db = getFirestore(app);
        const contactsRef = collection(db, 'contacts');

        await addDoc(contactsRef, {
            name,
            email,
            subject,
            message,
            createdAt: Timestamp.now(),
            status: 'new', // new, read, resolved
            userAgent: request.headers.get('user-agent') || '',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        });

        return NextResponse.json(
            { success: true, message: 'お問い合わせを受け付けました' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
