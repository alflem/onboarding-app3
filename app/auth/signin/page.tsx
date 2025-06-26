"use client";

import { getProviders, signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  useEffect(() => {
    async function fetchProviders() {
      const res = await getProviders();
      setProviders(res);
    }
    fetchProviders();
  }, []);

  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      if (session) {
        router.push(callbackUrl);
      }
    }
    checkSession();
  }, [router, callbackUrl]);

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthSignin":
        return "Det uppstod ett problem med OAuth-inloggning";
      case "OAuthCallback":
        return "Det uppstod ett problem med OAuth-callback";
      case "OAuthCreateAccount":
        return "Det uppstod ett problem när kontot skulle skapas";
      case "EmailCreateAccount":
        return "Det uppstod ett problem när e-postkontot skulle skapas";
      case "Callback":
        return "Det uppstod ett problem med callback";
      case "OAuthAccountNotLinked":
        return "För att bekräfta din identitet, logga in med samma konto som du använde ursprungligen";
      case "EmailSignin":
        return "E-postmeddelandet kunde inte skickas";
      case "CredentialsSignin":
        return "Inloggning misslyckades. Kontrollera uppgifterna du angav är korrekta";
      case "default":
        return "Det uppstod ett fel vid inloggning";
      default:
        return null;
    }
  };

  if (!providers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Laddar inloggningsalternativ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
            src="/logo.svg"
            alt="Onboarding App"
            width={60}
            height={60}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Logga in på ditt konto
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Välkommen till Onboarding App
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Inloggningsfel
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{getErrorMessage(error)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Välj inloggningsmetod</CardTitle>
            <CardDescription>
              Använd ditt Azure AD-konto för att logga in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(providers).map((provider) => (
              <Button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full"
                size="lg"
              >
                {provider.name === "Azure Active Directory" && (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4z"/>
                    <path d="M24 11.4H12.6V0H24v11.4z" fill="currentColor" opacity="0.8"/>
                  </svg>
                )}
                Logga in med {provider.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-600">
            Genom att logga in godkänner du våra användarvillkor och integritetspolicy
          </p>
        </div>
      </div>
    </div>
  );
}