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
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "@/lib/translations";

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

  // Språkstöd
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  useEffect(() => {
    async function fetchDashboardData() {
      if (status === "authenticated" && session?.user) {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/user-dashboard", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              // Session expired, redirect to signin
              window.location.href = "/auth/signin";
              return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          setDashboardData(data);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError("Det gick inte att ladda dina uppgifter. Försök igen senare.");
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        // Clear any stale data
        setDashboardData(null);
        setError(null);
      }
    }

    fetchDashboardData();
  }, [status, session?.user]);

  // Show loading only when NextAuth is still determining session status
  if (status === "loading") {
    return (
      <div className="container p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">{t('loading')}</p>
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
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4 max-w-2xl w-full mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold whitespace-nowrap">
              {status === "authenticated" && session?.user
                ? `${t('welcome_user')}, ${session.user.name || 'användare'}!`
                : t('welcome_to_platform')}
            </h1>
            {status === "authenticated" && session?.user && (
              <div className="text-lg md:text-xl text-white/90 whitespace-nowrap">
                {t('logged_in_to')} <span className="font-medium">
                  {session.user.organizationName || dashboardData?.organization?.name || t('loading_organization')}
                </span>
              </div>
            )}
            {status === "unauthenticated" && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto whitespace-nowrap">
                {t('seamless_onboarding_desc')}
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

        {status === "authenticated" && session?.user ? (
          <div className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-muted-foreground">Laddar dina uppgifter...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-4">
                    {/* Progress Circle & Title */}
                    <div className="flex flex-col items-center lg:items-start space-y-4 min-w-0">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{dashboardData?.progress || 0}%</span>
                        </div>
                      </div>
                      <div className="text-center lg:text-left">
                        <h3 className="text-xl font-semibold break-words">{t('onboarding_progress')}</h3>
                        <p className="text-sm text-muted-foreground break-words">{t('your_progress')}</p>
                      </div>
                    </div>

                    {/* Progress Bar Section */}
                    <div className="lg:col-span-2 space-y-4 min-w-0">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-sm font-medium">{t('completed_tasks')}</span>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">{t('tasks_completed_count', {completed: dashboardData?.completedTasks || 0, total: dashboardData?.totalTasks || 0})}</span>
                        </div>
                        <Progress value={dashboardData?.progress || 0} className="h-3" />
                      </div>

                      {dashboardData?.recentTasks && dashboardData.recentTasks.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">{t('recent_activity')}</span>
                          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                            {dashboardData.recentTasks.slice(0, 3).map((task) => (
                              <div key={task.id} className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full min-w-0 max-w-full">
                                <CheckCircle className="h-3 w-3 text-primary" />
                                <span className="text-xs font-medium text-accent-foreground truncate max-w-32">{task.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col space-y-3 min-w-0 w-full">
                      <Button asChild className="w-full h-12 text-base font-semibold" size="lg">
                        <Link href="/checklist">
                          {t('continue')} <ArrowRight className="h-5 w-5 ml-2" />
                        </Link>
                      </Button>
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        {dashboardData ? `${100 - (dashboardData.progress || 0)}% ${t('remaining')}` : ''}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Du kan lägga till fler kort här, t.ex. information om buddy, kommande möten, etc. */}
            </div>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('onboarding_platform')}</CardTitle>
                <CardDescription>
                  {t('seamless_onboarding_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Vår onboardingplattform hjälper nya medarbetare att komma igång snabbare
                  och mer effektivt.
                </p>
                <Button asChild>
                  <Link href="/auth/signin">{t('get_started_now')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('benefits')}</CardTitle>
                <CardDescription>{t('why_use_platform')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                    <span>{t('personal_checklists')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                    <span>{t('buddy_system')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                    <span>{t('customizable_checklists')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
                    <span>{t('clear_progress_tracking')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Fallback for unknown states
          <div className="text-center p-8">
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        )}
      </div>
    </div>
  );
}