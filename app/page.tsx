"use client"

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
}

interface RecentTask {
  id: string;
  title: string;
  description: string | null;
  completedAt: string;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  organization: Organization;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  recentTasks: RecentTask[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (status === "authenticated") {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/user-dashboard");
          if (!response.ok) {
            throw new Error("Kunde inte hämta användardata");
          }

          const data = await response.json();
          setDashboardData(data);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError("Det gick inte att ladda dina uppgifter. Försök igen senare.");
        } finally {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="container p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Laddar dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section with Company Image */}
      <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg">
        <Image
          src="/xlent-- 351_klar_web.jpg"
          alt="Xlent företagsbild"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white space-y-4 px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              {status === "authenticated"
                ? `Välkommen, ${session?.user?.name || 'användare'}!`
                : "Välkommen till Onboarding-plattformen!"}
            </h1>
            {status === "authenticated" && dashboardData?.organization && (
              <div className="text-lg md:text-xl text-white/90">
                Du är inloggad på <span className="font-medium">{dashboardData.organization.name}</span>
              </div>
            )}
            {status !== "authenticated" && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                En sömlös och strukturerad onboarding för nya medarbetare
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container p-4 md:p-8 space-y-8">

      <Separator />

      {error && (
        <div className="bg-destructive/10 border border-destructive p-4 rounded-md">
          <p className="text-destructive">{error}</p>
        </div>
      )}

            {status === "authenticated" ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                {/* Progress Circle & Title */}
                <div className="flex flex-col items-center lg:items-start space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{dashboardData?.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="text-xl font-semibold">Onboarding Progress</h3>
                    <p className="text-sm text-muted-foreground">Din framsteg hittills</p>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Slutförda uppgifter</span>
                      <span className="text-sm text-muted-foreground">{dashboardData?.completedTasks || 0}/{dashboardData?.totalTasks || 0} uppgifter avklarade</span>
                    </div>
                    <Progress value={dashboardData?.progress || 0} className="h-3" />
                  </div>

                  {dashboardData?.recentTasks && dashboardData.recentTasks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Senaste aktivitet</span>
                      <div className="flex flex-wrap gap-2">
                        {dashboardData.recentTasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700 truncate max-w-32">
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex flex-col space-y-3">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/checklist">
                      Fortsätt
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {Math.max(0, 100 - (dashboardData?.progress || 0))}% återstår
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                Senast avklarade uppgifter
              </CardTitle>
              <CardDescription>Dina senaste framsteg i onboarding-processen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData?.recentTasks && dashboardData.recentTasks.length > 0 ? (
                dashboardData.recentTasks.map((task) => (
                  <div key={task.id} className="border rounded-md p-3 bg-accent/30">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Avklarad: {new Date(task.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Inga avklarade uppgifter än. Börja med din checklista!
                </div>
              )}

              {dashboardData?.recentTasks && dashboardData.recentTasks.length > 0 && (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/checklist">
                    Visa alla uppgifter
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card> */}

          {/* Du kan lägga till fler kort här, t.ex. information om buddy, kommande möten, etc. */}
          </div>
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
    </div>
  );
}