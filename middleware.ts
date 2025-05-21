// middleware.ts i root
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Skydda alla rutter som börjar med /dashboard, /admin, etc.
    "/dashboard/:path*",
    "/admin/:path*",
    "/checklist/:path*",
    // Exkludera API-rutter och publika rutter
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)",
  ],
};