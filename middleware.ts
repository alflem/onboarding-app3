import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // This function runs when the user is authenticated
    console.log("Middleware executed for:", req.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access if user has a valid token
        if (token) {
          console.log("User authorized with token:", token.email);
          return true;
        }

        console.log("User not authorized for:", req.nextUrl.pathname);
        return false;
      },
    },
    pages: {
      error: '/auth/error',
    }
  }
);

export const config = {
  matcher: [
    // Protect specific routes
    "/dashboard/:path*",
    "/admin/:path*",
    "/checklist/:path*",
    "/super-admin/:path*",
    "/api/user-dashboard/:path*",
    "/api/checklist/:path*",
    "/api/employees/:path*",
    "/api/tasks/:path*",
    "/api/templates/:path*",
    "/api/categories/:path*",
    "/api/organization/:path*",
    "/api/organizations/:path*",
    "/api/task-progress/:path*",
    "/api/buddies/:path*",
    "/api/user/:path*",
    "/api/users/:path*"
  ],
};