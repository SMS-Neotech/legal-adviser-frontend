'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Copy } from 'lucide-react';
import { useTranslation } from '@/components/language-provider';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';


function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.651-3.358-11.303-8H2.477c3.524,9.58,12.977,16,21.523,16z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.636,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
    )
}

export default function LoginPage() {
  const { signInWithGoogle, user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<any>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setAuthError(error);
    }
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(origin);
    toast({
      description: "Copied to clipboard!",
    });
  };

  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Logo className="size-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">{t('loading')}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-grid-pattern">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-sm bg-background/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo className="size-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              {t('welcomeToLegalAdvisor')}
            </CardTitle>
            <CardDescription>{t('signInToContinue')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isFirebaseConfigured ? (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>{t('firebaseNotConfigured')}</AlertTitle>
                <AlertDescription>
                  {t('firebaseNotConfiguredMessage')}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {authError && authError.code === 'auth/unauthorized-domain' && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Domain Not Authorized</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">This domain is not authorized for authentication. Please add the following origin to your Firebase project's authorized domains:</p>
                      <div className="flex items-center gap-2 p-2 rounded-md bg-legal-dark/20 text-xs">
                        <span className="flex-1 overflow-x-auto">{origin}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyOrigin}>
                            <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleSignIn} className="w-full" variant="outline">
                  <GoogleIcon />
                  <span className='ml-2'>{t('signInWithGoogle')}</span>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
