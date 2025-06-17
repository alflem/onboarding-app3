// components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, CheckSquare, Settings, Building, Menu, X, UserCheck } from "lucide-react";
import { useSession, signOut } from "next-auth/react"; // Använd NextAuth hooks
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "@/lib/translations";

// Typdeklarationer som matchar Prisma-schemat
enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE"
}

const Header: React.FC = () => {
  // Använd NextAuth's useSession hook
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isBuddy, setIsBuddy] = useState<boolean>(false);
  const [buddyEnabled, setBuddyEnabled] = useState<boolean>(false);

  // Språkhantering
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  useEffect(() => {
    // Kontrollera om användaren är buddy för någon
    if (session?.user?.id) {
      fetch('/api/user/is-buddy')
        .then(response => response.json())
        .then(data => {
          setIsBuddy(data.isBuddy);
          setBuddyEnabled(data.buddyEnabled);
        })
        .catch(error => {
          console.error("Kunde inte kontrollera buddystatus:", error);
          setIsBuddy(false);
          setBuddyEnabled(false);
        });
    }
  }, [session?.user?.id]);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Funktion för att kontrollera om en knapp är aktiv baserat på nuvarande sökväg
  const isActive = (path: string): boolean => {
    return pathname === path;
  };

  // Funktion för att kontrollera användarroll baserat på Prisma Role enum
  const hasRole = (requiredRole: Role): boolean => {
    if (!session?.user?.role) return false;

    const roleHierarchy: Record<Role, number> = {
      [Role.EMPLOYEE]: 1,
      [Role.ADMIN]: 2,
      [Role.SUPER_ADMIN]: 3
    };

    const userRoleLevel = roleHierarchy[session.user.role as Role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* App logo and title */}
          <div className="flex-1 flex items-center justify-center md:justify-start min-w-0 md:mr-4">
            <Link href="/" className="flex items-center gap-2 text-foreground font-medium text-lg min-w-0">
              <Image
                src="/logo.svg"
                alt="Company Logo"
                width={28}
                height={28}
                className="h-7 w-auto"
                style={{ width: 'auto', height: '28px' }}
              />
              <span className="truncate max-w-[120px] sm:max-w-none">Onboarding</span>
            </Link>
          </div>

          {/* Desktop navigation - alla knappar samlade på högersidan */}
          <nav className="hidden md:flex items-center space-x-1 min-w-0">
            <Link href="/" passHref>
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                aria-current={isActive("/") ? "page" : undefined}
              >
                <Home className="mr-1 h-4 w-4" />
                {t('home')}
              </Button>
            </Link>

            {session?.user && (
              <Link href="/checklist" passHref>
                <Button
                  variant={isActive("/checklist") ? "default" : "ghost"}
                  size="sm"
                  aria-current={isActive("/checklist") ? "page" : undefined}
                >
                  <CheckSquare className="mr-1 h-4 w-4" />
                  {t('checklist')}
                </Button>
              </Link>
            )}

            {session?.user && isBuddy && buddyEnabled && (
              <Link href="/checklist/buddy" passHref>
                <Button
                  variant={isActive("/checklist/buddy") ? "default" : "ghost"}
                  size="sm"
                  aria-current={isActive("/checklist/buddy") ? "page" : undefined}
                >
                  <UserCheck className="mr-1 h-4 w-4" />
                  {t('buddy_checklist')}
                </Button>
              </Link>
            )}

            {hasRole(Role.ADMIN) && (
              <Link href="/admin" passHref>
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  size="sm"
                  aria-current={isActive("/admin") ? "page" : undefined}
                >
                  <Settings className="mr-1 h-4 w-4" />
                  {t('admin')}
                </Button>
              </Link>
            )}

            {hasRole(Role.SUPER_ADMIN) && (
              <Link href="/super-admin" passHref>
                <Button
                  variant={isActive("/super-admin") ? "default" : "ghost"}
                  size="sm"
                  aria-current={isActive("/super-admin") ? "page" : undefined}
                >
                  <Building className="mr-1 h-4 w-4" />
                  {t('organization')}
                </Button>
              </Link>
            )}

            {/* Language selector */}
            <LanguageSelector />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User authentication */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse ml-2"></div>
            ) : status === "authenticated" && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center ml-2"
                  >
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-muted text-foreground">
                        {session.user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm">{session.user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {session.user.organizationName || 'Loading organization...'}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  >
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  {t('login')}
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobilmeny-knapp */}
          <div className="md:hidden flex items-center">
            <button
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Stäng meny' : 'Öppna meny'}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobilmeny */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-background border-b border-border shadow-lg z-50 animate-fade-in">
          <nav className="flex flex-col items-stretch p-4 space-y-2">
            <Link href="/" passHref legacyBehavior>
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="lg"
                className="justify-start w-full"
                aria-current={isActive("/") ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="mr-2 h-5 w-5" /> {t('home')}
              </Button>
            </Link>
            {session?.user && (
              <Link href="/checklist" passHref legacyBehavior>
                <Button
                  variant={isActive("/checklist") ? "default" : "ghost"}
                  size="lg"
                  className="justify-start w-full"
                  aria-current={isActive("/checklist") ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <CheckSquare className="mr-2 h-5 w-5" /> {t('checklist')}
                </Button>
              </Link>
            )}
            {session?.user && isBuddy && buddyEnabled && (
              <Link href="/checklist/buddy" passHref legacyBehavior>
                <Button
                  variant={isActive("/checklist/buddy") ? "default" : "ghost"}
                  size="lg"
                  className="justify-start w-full"
                  aria-current={isActive("/checklist/buddy") ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCheck className="mr-2 h-5 w-5" /> {t('buddy_checklist')}
                </Button>
              </Link>
            )}
            {hasRole(Role.ADMIN) && (
              <Link href="/admin" passHref legacyBehavior>
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  size="lg"
                  className="justify-start w-full"
                  aria-current={isActive("/admin") ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="mr-2 h-5 w-5" /> {t('admin')}
                </Button>
              </Link>
            )}
            {hasRole(Role.SUPER_ADMIN) && (
              <Link href="/super-admin" passHref legacyBehavior>
                <Button
                  variant={isActive("/super-admin") ? "default" : "ghost"}
                  size="lg"
                  className="justify-start w-full"
                  aria-current={isActive("/super-admin") ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Building className="mr-2 h-5 w-5" /> {t('organization')}
                </Button>
              </Link>
            )}
            <div className="flex items-center justify-between gap-2 mt-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            {status === "authenticated" && session?.user && (
              <div className="flex items-center gap-2 mt-4">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-muted text-foreground">
                    {session.user.name?.split(" ").map((n) => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate max-w-[120px]">{session.user.name}</span>
                <Button variant="ghost" size="sm" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                  {t('logout')}
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;