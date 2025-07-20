'use client';

import { useAuth } from '@/components/auth-provider';
import ChatLayout from '@/components/chat-layout';
import { Logo } from '@/components/icons';
import { useTranslation } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo className="size-12 animate-pulse" />
          <p className="text-muted-foreground">{t('loadingExperience')}</p>
        </div>
      </div>
    );
  }

  return <ChatLayout user={user} />;
}
