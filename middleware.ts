// middleware.ts i root
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Skydda alla rutter som börjar med /dashboard, /admin, etc.
    "/dashboard/:path*",
    "/admin/:path*",
    "/checklist/:path*",
    "/super-admin/:path*",
    // Exkludera API-rutter, publika rutter och hemside
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/signout|auth/error|/$|$|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.gif|.*\\.ico|.*\\.webp).*)",
  ],
};