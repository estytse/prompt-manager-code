import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that should be publicly accessible without authentication
const isPublicRoute = createRouteMatcher([
	"/", // Root/marketing page
	"/sign-in(.*)" // Sign-in pages
]);

// Export the middleware function
export default clerkMiddleware(async (auth, req) => {
  // Check if the requested route is NOT public
  if (!isPublicRoute(req)) {
    // If it's not public, enforce authentication
    // auth().protect() redirects unauthenticated users to the sign-in page
    await auth.protect();
  }
  // If it IS a public route, the middleware does nothing further,
  // allowing the request to proceed without authentication checks.
});

// Configuration object for the middleware
export const config = {
  matcher: [
    // Match all routes except for:
    // 1. API routes specific to Next.js internals (_next/...)
    // 2. Static files (images, fonts, CSS, etc.) unless found in search params
    // 3. Favicon and other static assets
    // This ensures the middleware runs efficiently only on actual page/API requests.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run the middleware for API routes (starting with /api or /trpc)
    "/(api|trpc)(.*)"
  ]
}; 