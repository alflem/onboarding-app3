// middleware.ts i root
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Skydda specifika rutter
    "/dashboard/:path*",
    "/admin/:path*",
    "/checklist/:path*",
    "/super-admin/:path*",
  ],
};