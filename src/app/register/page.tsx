'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/SessionContext';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loginWithGoogle } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    document.title = 'GapLogic | Register';

    if (auth) {
      getRedirectResult(auth)
        .then(async (result) => {
          if (result && result.user && result.user.email) {
            setGoogleLoading(true);
            await loginWithGoogle(result.user.email, result.user.displayName || 'Google User');
            toast({ title: 'Success', description: 'Logged in with Google!' });
            
            // Check if we came from Android app
            const params = new URLSearchParams(window.location.search);
            const platform = params.get('platform');
            if (platform === 'android') {
              const token = localStorage.getItem('gaplogic_token');
              if (token) {
                window.location.href = `gaplogic://auth?token=${token}`;
                return;
              }
            }
            router.push('/');
          }
        })
        .catch((error: any) => {
          console.error('[Google Redirect Error]', error);
          toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description: error.message || 'Google sign-in redirect failed.',
          });
        })
        .finally(() => {
          setGoogleLoading(false);
        });
    }
  }, [router, loginWithGoogle, toast]);

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: 'Firebase auth was not initialized correctly.',
      });
      return;
    }

    setGoogleLoading(true);
    try {
      const isWebView = typeof window !== 'undefined' && 
        (navigator.userAgent.includes('GapLogicAndroid') || 
         navigator.userAgent.includes('GapLogicMobile') || 
         (window as any).Android);

      if (isWebView) {
        // Redirect to external browser via custom Android intercept scheme
        // Use production Firebase Hosting URL for external Google authentication
        // to prevent sessionStorage partitioning issues on insecure local HTTP/IP origins in Chrome
        const productionDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gaplogic-20118.firebaseapp.com';
        const authUrl = `https://${productionDomain}/register?platform=android`;
        window.location.href = `gaplogic-open-browser://${authUrl}`;
        setGoogleLoading(false);
        return;
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        if (user && user.email) {
          await loginWithGoogle(user.email, user.displayName || 'Google User');
          toast({ title: 'Success', description: 'Logged in with Google!' });
          
          // Check if we came from Android app
          const params = new URLSearchParams(window.location.search);
          const platform = params.get('platform');
          if (platform === 'android') {
            const token = localStorage.getItem('gaplogic_token');
            if (token) {
              window.location.href = `gaplogic://auth?token=${token}`;
              return;
            }
          }
          router.push('/');
        } else {
          throw new Error('Google account credentials not found');
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'Google login was cancelled.',
      });
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org)$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email Format',
        description: 'Email must be in a valid format ending with .com or .org',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password Mismatch',
        description: 'Passwords do not match',
      });
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.name);
      toast({ title: 'Success', description: 'Account created successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join GapLogic</h1>
          <p className="text-muted-foreground">Create your account to start tracking behavioral gaps</p>
        </div>

        {/* Register Form */}
        <Card className="clean-card border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl h-12 bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl h-12 bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="rounded-xl h-12 bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="rounded-xl h-12 bg-background"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold rounded-xl"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-foreground font-semibold flex items-center justify-center transition-all duration-300"
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Google
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
