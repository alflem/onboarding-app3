"use client";

import { useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        // User is already signed in, redirect to callback URL
        router.push(callbackUrl);
      } else {
        // User is not signed in, redirect directly to Azure AD
        signIn('azure-ad', { callbackUrl });
      }
    });
  }, [callbackUrl, router]);

  // Show minimal loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}