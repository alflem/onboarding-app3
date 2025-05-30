"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftSignIn = () => {
    setIsLoading(true);
    signIn("azure-ad", { callbackUrl: "/" });
  };

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="fixed inset-0 flex items-center justify-center">
        <Card className="w-[320px] shadow-lg">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-center text-xl">Välkommen</CardTitle>
            <CardDescription className="text-center text-xs">
              Logga in på din onboarding-app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleMicrosoftSignIn}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Loggar in..." : (
                <>
                  Logga in med Microsoft
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}