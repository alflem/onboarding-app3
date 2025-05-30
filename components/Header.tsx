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
          console.error("Kunde inte kontrollera buddy-status:", error);
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* App logo and title */}
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-2 text-foreground font-medium text-lg">
            <Image
              src="/logo.svg"
              alt="Company Logo"
              width={28}
              height={28}
              className="h-7 w-auto"
              style={{ width: 'auto', height: '28px' }}
            />
            Onboarding
          </Link>
        </div>

          {/* Desktop navigation - alla knappar samlade på högersidan */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/" passHref>
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                aria-current={isActive("/") ? "page" : undefined}
              >
                <Home className="mr-1 h-4 w-4" />
                Hem
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
                  Checklista
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
                  Buddy-Checklista
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
                  Admin
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
                  Organisationer
                </Button>
              </Link>
            )}

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
                    {session.user.organization.name}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => signOut()}
                  >
                    Logga ut
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
                  Logga in
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
              onClick={toggleMenu}
            >
              <div className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                Hem
              </div>
            </Link>

            {session?.user && (
              <Link
                href="/checklist"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/checklist")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Checklista
                </div>
              </Link>
            )}

            {session?.user && isBuddy && buddyEnabled && (
              <Link
                href="/checklist/buddy"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/checklist/buddy")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Buddy-Checklista
                </div>
              </Link>
            )}

            {hasRole(Role.ADMIN) && (
              <Link
                href="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </div>
              </Link>
            )}

            {hasRole(Role.SUPER_ADMIN) && (
              <Link
                href="/super-admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/super-admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  Organisationer
                </div>
              </Link>
            )}

            {/* User authentication for mobile */}
            <div className="pt-4 pb-3 border-t border-border">
              {status === "loading" ? (
                                  <div className="flex items-center px-5">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                    <div className="ml-3 w-24 h-4 bg-muted animate-pulse rounded"></div>
                  </div>
              ) : status === "authenticated" && session?.user ? (
                <>
                  <div className="flex items-center px-5">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-muted text-foreground">
                        {session.user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-base font-medium text-foreground">
                        {session.user.name}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {session.user.organization.name}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium">Tema</span>
                        <ThemeToggle />
                      </div>
                    </div>

                    <button
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-accent/50"
                      onClick={() => {
                        signOut();
                        toggleMenu();
                      }}
                    >
                      Logga ut
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-3 px-2">
                  <Link
                    href="/auth/signin"
                    className="block w-full"
                    onClick={toggleMenu}
                  >
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Logga in
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;