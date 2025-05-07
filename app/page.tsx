
"use client"

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowRight } from "lucide-react";


interface Organization {
  id: string;
  name: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // I en riktig app skulle vi hämta denna data från en API
    if (status === "authenticated") {
      // Simulera API-anrop
      setOrganization({
        id: "org123",
        name: "Exempel AB"
      });

      // Simulera progress
      setProgress(35);
    }
  }, [status]);

  if (status === "loading") {
    return <div className="container p-8 flex justify-center">Laddar...</div>;
  }

  return (
    <div className="container p-4 md:p-8 space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">
          {status === "authenticated"
            ? `Välkommen, ${session.user.name}!`
            : "Välkommen till Onboarding-plattformen!"}
        </h1>

        {status === "authenticated" && organization && (
          <div className="text-lg text-muted-foreground">
            Du är inloggad på <span className="font-medium text-foreground">{organization.name}</span>
          </div>
        )}
      </section>

      <Separator />

      {status === "authenticated" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Din onboarding-progress</CardTitle>
              <CardDescription>Du har klarat {progress}% av din checklista</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-3 mb-4" />
              <Button asChild className="w-full">
                <Link href="/checklist">
                  Fortsätt med din checklista
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                Exempel Kort
              </CardTitle>
              <CardDescription>Lorem Ipsum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-3 bg-accent/30">
                <div className="font-medium">Test</div>
                <div className="text-sm text-muted-foreground">
                  Ett introduktionsmöte med din chef för att diskutera mål
                </div>
              </div>
              <div className="border rounded-md p-3 bg-accent/30">
                <div className="font-medium">Test</div>
                <div className="text-sm text-muted-foreground">
                  Ett introduktionsmöte med din chef för att diskutera mål
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding-plattform</CardTitle>
              <CardDescription>
                En sömlös och strukturerad onboarding för nya medarbetare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vår onboarding-plattform hjälper nya medarbetare att komma igång snabbare
                och effektivare. Med personliga checklistor, dokumentation och guider.
              </p>
              <Button asChild>
                <Link href="/auth/signin">Kom igång nu</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fördelar</CardTitle>
              <CardDescription>Varför använda vår onboarding-plattform</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Personliga checklistor för varje medarbetare</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Buddy-system för att stödja nya medarbetare</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Anpassningsbara checklistor för organisationens behov</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Tydlig uppföljning av framsteg</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}